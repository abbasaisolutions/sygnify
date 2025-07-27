#!/usr/bin/env python3
"""
Kafka Connector for Sygnify Analytics Hub
Supports real-time streaming data from Kafka topics
"""

import sys
import json
import argparse
import logging
from typing import Dict, List, Any, Optional
from kafka import KafkaConsumer, KafkaProducer
from kafka.errors import KafkaError
import threading
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class KafkaConnector:
    """Kafka connector for real-time data streaming"""
    
    def __init__(self):
        self.consumer = None
        self.producer = None
        self.is_running = False
        self.message_buffer = []
        self.max_buffer_size = 1000
    
    def connect_consumer(self, bootstrap_servers: str, topic: str, group_id: str, 
                        auto_offset_reset: str = 'latest', enable_auto_commit: bool = True) -> Dict[str, Any]:
        """
        Connect to Kafka consumer
        
        Args:
            bootstrap_servers: Kafka broker addresses
            topic: Topic to consume from
            group_id: Consumer group ID
            auto_offset_reset: Offset reset policy
            enable_auto_commit: Enable auto commit
            
        Returns:
            Connection status and metadata
        """
        try:
            logger.info(f"Connecting to Kafka consumer: {bootstrap_servers}, topic: {topic}")
            
            self.consumer = KafkaConsumer(
                topic,
                bootstrap_servers=bootstrap_servers.split(','),
                group_id=group_id,
                auto_offset_reset=auto_offset_reset,
                enable_auto_commit=enable_auto_commit,
                value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                key_deserializer=lambda m: m.decode('utf-8') if m else None
            )
            
            # Get topic metadata
            topic_metadata = self._get_topic_metadata(topic)
            
            connection_info = {
                'success': True,
                'type': 'consumer',
                'bootstrap_servers': bootstrap_servers,
                'topic': topic,
                'group_id': group_id,
                'metadata': topic_metadata,
                'status': 'connected'
            }
            
            logger.info(f"Successfully connected to Kafka consumer")
            return connection_info
            
        except Exception as e:
            logger.error(f"Failed to connect to Kafka consumer: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'type': 'consumer'
            }
    
    def connect_producer(self, bootstrap_servers: str) -> Dict[str, Any]:
        """
        Connect to Kafka producer
        
        Args:
            bootstrap_servers: Kafka broker addresses
            
        Returns:
            Connection status
        """
        try:
            logger.info(f"Connecting to Kafka producer: {bootstrap_servers}")
            
            self.producer = KafkaProducer(
                bootstrap_servers=bootstrap_servers.split(','),
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                key_serializer=lambda k: k.encode('utf-8') if k else None
            )
            
            connection_info = {
                'success': True,
                'type': 'producer',
                'bootstrap_servers': bootstrap_servers,
                'status': 'connected'
            }
            
            logger.info(f"Successfully connected to Kafka producer")
            return connection_info
            
        except Exception as e:
            logger.error(f"Failed to connect to Kafka producer: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'type': 'producer'
            }
    
    def start_consuming(self, max_messages: int = 100, timeout_ms: int = 5000) -> List[Dict[str, Any]]:
        """
        Start consuming messages from Kafka
        
        Args:
            max_messages: Maximum number of messages to consume
            timeout_ms: Timeout in milliseconds
            
        Returns:
            List of consumed messages
        """
        if not self.consumer:
            raise ValueError("Consumer not connected")
        
        messages = []
        message_count = 0
        
        try:
            logger.info(f"Starting to consume messages (max: {max_messages})")
            
            # Consume messages
            for message in self.consumer:
                if message_count >= max_messages:
                    break
                
                # Parse message
                parsed_message = {
                    'topic': message.topic,
                    'partition': message.partition,
                    'offset': message.offset,
                    'key': message.key,
                    'value': message.value,
                    'timestamp': message.timestamp,
                    'timestamp_type': message.timestamp_type
                }
                
                messages.append(parsed_message)
                message_count += 1
                
                # Add to buffer for real-time processing
                self.message_buffer.append(parsed_message)
                if len(self.message_buffer) > self.max_buffer_size:
                    self.message_buffer.pop(0)
                
                # Output message for Node.js to capture
                print(json.dumps({
                    'type': 'message',
                    'data': parsed_message
                }))
                
        except Exception as e:
            logger.error(f"Error consuming messages: {str(e)}")
            print(json.dumps({
                'type': 'error',
                'error': str(e)
            }))
        
        return messages
    
    def start_streaming_consumer(self, callback_interval: int = 1000) -> None:
        """
        Start streaming consumer that continuously processes messages
        
        Args:
            callback_interval: Interval in milliseconds to process buffered messages
        """
        if not self.consumer:
            raise ValueError("Consumer not connected")
        
        self.is_running = True
        
        def stream_processor():
            while self.is_running:
                try:
                    # Process buffered messages
                    if self.message_buffer:
                        batch = self.message_buffer.copy()
                        self.message_buffer.clear()
                        
                        # Output batch for Node.js
                        print(json.dumps({
                            'type': 'batch',
                            'data': batch,
                            'count': len(batch)
                        }))
                    
                    time.sleep(callback_interval / 1000)
                    
                except Exception as e:
                    logger.error(f"Error in stream processor: {str(e)}")
                    print(json.dumps({
                        'type': 'error',
                        'error': str(e)
                    }))
        
        # Start streaming in background thread
        stream_thread = threading.Thread(target=stream_processor, daemon=True)
        stream_thread.start()
        
        # Start consuming messages
        try:
            for message in self.consumer:
                if not self.is_running:
                    break
                
                # Parse message
                parsed_message = {
                    'topic': message.topic,
                    'partition': message.partition,
                    'offset': message.offset,
                    'key': message.key,
                    'value': message.value,
                    'timestamp': message.timestamp,
                    'timestamp_type': message.timestamp_type
                }
                
                # Add to buffer
                self.message_buffer.append(parsed_message)
                if len(self.message_buffer) > self.max_buffer_size:
                    self.message_buffer.pop(0)
                
        except Exception as e:
            logger.error(f"Error in streaming consumer: {str(e)}")
            print(json.dumps({
                'type': 'error',
                'error': str(e)
            }))
    
    def send_message(self, topic: str, message: Dict[str, Any], key: Optional[str] = None) -> Dict[str, Any]:
        """
        Send message to Kafka topic
        
        Args:
            topic: Topic to send message to
            message: Message data
            key: Message key (optional)
            
        Returns:
            Send status
        """
        if not self.producer:
            raise ValueError("Producer not connected")
        
        try:
            future = self.producer.send(topic, value=message, key=key)
            record_metadata = future.get(timeout=10)
            
            result = {
                'success': True,
                'topic': record_metadata.topic,
                'partition': record_metadata.partition,
                'offset': record_metadata.offset,
                'timestamp': record_metadata.timestamp
            }
            
            logger.info(f"Message sent successfully: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to send message: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _get_topic_metadata(self, topic: str) -> Dict[str, Any]:
        """Get topic metadata"""
        try:
            partitions = self.consumer.partitions_for_topic(topic)
            if partitions:
                partition_info = []
                for partition in partitions:
                    beginning_offset = self.consumer.beginning_offsets([partition])[partition]
                    end_offset = self.consumer.end_offsets([partition])[partition]
                    
                    partition_info.append({
                        'partition': partition,
                        'beginning_offset': beginning_offset,
                        'end_offset': end_offset,
                        'message_count': end_offset - beginning_offset
                    })
                
                return {
                    'topic': topic,
                    'partitions': partition_info,
                    'total_partitions': len(partitions)
                }
            else:
                return {
                    'topic': topic,
                    'partitions': [],
                    'total_partitions': 0
                }
                
        except Exception as e:
            logger.warning(f"Could not get topic metadata: {str(e)}")
            return {
                'topic': topic,
                'error': str(e)
            }
    
    def close(self) -> None:
        """Close Kafka connections"""
        self.is_running = False
        
        if self.consumer:
            self.consumer.close()
            logger.info("Kafka consumer closed")
        
        if self.producer:
            self.producer.close()
            logger.info("Kafka producer closed")

def main():
    """Main function for command-line usage"""
    parser = argparse.ArgumentParser(description='Kafka Connector for Sygnify Analytics Hub')
    parser.add_argument('--bootstrap-servers', required=True, help='Kafka broker addresses (comma-separated)')
    parser.add_argument('--topic', help='Topic to consume from')
    parser.add_argument('--group-id', help='Consumer group ID')
    parser.add_argument('--mode', choices=['consumer', 'producer', 'stream'], default='consumer', 
                       help='Connection mode')
    parser.add_argument('--max-messages', type=int, default=100, help='Maximum messages to consume')
    parser.add_argument('--timeout', type=int, default=5000, help='Timeout in milliseconds')
    parser.add_argument('--auto-offset-reset', default='latest', 
                       choices=['earliest', 'latest'], help='Offset reset policy')
    parser.add_argument('--enable-auto-commit', action='store_true', help='Enable auto commit')
    
    args = parser.parse_args()
    
    try:
        kafka_connector = KafkaConnector()
        
        if args.mode == 'consumer':
            # Connect as consumer
            if not args.topic or not args.group_id:
                logger.error("Topic and group-id are required for consumer mode")
                sys.exit(1)
            
            connection_info = kafka_connector.connect_consumer(
                args.bootstrap_servers,
                args.topic,
                args.group_id,
                args.auto_offset_reset,
                args.enable_auto_commit
            )
            
            if connection_info['success']:
                print(json.dumps(connection_info))
                
                # Start consuming
                messages = kafka_connector.start_consuming(args.max_messages, args.timeout)
                
                # Output final result
                print(json.dumps({
                    'type': 'final_result',
                    'success': True,
                    'messages_consumed': len(messages),
                    'messages': messages
                }))
            else:
                print(json.dumps(connection_info))
                sys.exit(1)
        
        elif args.mode == 'producer':
            # Connect as producer
            connection_info = kafka_connector.connect_producer(args.bootstrap_servers)
            print(json.dumps(connection_info))
            
            if not connection_info['success']:
                sys.exit(1)
        
        elif args.mode == 'stream':
            # Connect as streaming consumer
            if not args.topic or not args.group_id:
                logger.error("Topic and group-id are required for stream mode")
                sys.exit(1)
            
            connection_info = kafka_connector.connect_consumer(
                args.bootstrap_servers,
                args.topic,
                args.group_id,
                args.auto_offset_reset,
                args.enable_auto_commit
            )
            
            if connection_info['success']:
                print(json.dumps(connection_info))
                
                # Start streaming
                kafka_connector.start_streaming_consumer()
            else:
                print(json.dumps(connection_info))
                sys.exit(1)
        
        sys.exit(0)
        
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
        if 'kafka_connector' in locals():
            kafka_connector.close()
        sys.exit(0)
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'mode': args.mode
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    main() 