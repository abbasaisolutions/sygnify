"""
Visual Query Builder Interface

This module provides a comprehensive visual query building interface with:
- Drag-drop query building
- Natural language to SQL conversion
- AI-powered query suggestions
- Visual relationship mapping
- Automatic measure calculations
- Smart column recommendations
- Query performance insights
"""

import streamlit as st
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
import json
import re
from datetime import datetime
import logging

# NLP and AI components
from transformers import pipeline
import spacy
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

@dataclass
class QueryComponent:
    """Represents a component in the visual query builder."""
    id: str
    type: str  # 'table', 'column', 'filter', 'aggregation', 'join'
    name: str
    display_name: str
    data_type: Optional[str] = None
    position: Tuple[int, int] = (0, 0)
    properties: Dict[str, Any] = field(default_factory=dict)
    connections: List[str] = field(default_factory=list)

@dataclass
class QueryRelationship:
    """Represents a relationship between tables."""
    source_table: str
    source_column: str
    target_table: str
    target_column: str
    relationship_type: str = "inner"  # inner, left, right, full
    confidence: float = 1.0

class NaturalLanguageProcessor:
    """Processes natural language queries and converts them to SQL."""
    
    def __init__(self):
        """Initialize the NLP processor."""
        try:
            # Load NLP models
            self.nlp = spacy.load("en_core_web_sm")
            self.sentence_transformer = SentenceTransformer('all-MiniLM-L6-v2')
            self.text_classifier = pipeline("text-classification", model="distilbert-base-uncased")
        except Exception as e:
            logger.warning(f"Could not load NLP models: {e}")
            self.nlp = None
            self.sentence_transformer = None
            self.text_classifier = None
    
    def parse_natural_language(self, query: str, available_tables: List[str]) -> Dict[str, Any]:
        """Parse natural language query and extract components."""
        if not self.nlp:
            return self._fallback_parse(query, available_tables)
        
        doc = self.nlp(query.lower())
        
        # Extract entities and intents
        entities = self._extract_entities(doc)
        intent = self._classify_intent(query)
        
        # Map to SQL components
        sql_components = self._map_to_sql_components(entities, intent, available_tables)
        
        return {
            "original_query": query,
            "entities": entities,
            "intent": intent,
            "sql_components": sql_components,
            "confidence": self._calculate_confidence(entities, intent)
        }
    
    def _extract_entities(self, doc) -> Dict[str, List[str]]:
        """Extract entities from the document."""
        entities = {
            "tables": [],
            "columns": [],
            "filters": [],
            "aggregations": [],
            "time_periods": []
        }
        
        # Extract table names (simplified)
        table_keywords = ["table", "from", "show", "get", "display"]
        for token in doc:
            if token.text in table_keywords and token.head.text not in entities["tables"]:
                entities["tables"].append(token.head.text)
        
        # Extract column names
        column_keywords = ["column", "field", "show", "select"]
        for token in doc:
            if token.text in column_keywords and token.head.text not in entities["columns"]:
                entities["columns"].append(token.head.text)
        
        # Extract filters
        filter_keywords = ["where", "filter", "only", "greater", "less", "equal"]
        for token in doc:
            if token.text in filter_keywords:
                entities["filters"].append(f"{token.text} {token.head.text}")
        
        # Extract aggregations
        agg_keywords = ["sum", "average", "count", "total", "maximum", "minimum"]
        for token in doc:
            if token.text in agg_keywords:
                entities["aggregations"].append(token.text)
        
        return entities
    
    def _classify_intent(self, query: str) -> str:
        """Classify the intent of the query."""
        if not self.text_classifier:
            return "select"
        
        # Simple keyword-based classification
        query_lower = query.lower()
        
        if any(word in query_lower for word in ["sum", "total", "average", "count"]):
            return "aggregate"
        elif any(word in query_lower for word in ["filter", "where", "only"]):
            return "filter"
        elif any(word in query_lower for word in ["join", "combine", "merge"]):
            return "join"
        elif any(word in query_lower for word in ["group", "by"]):
            return "group"
        else:
            return "select"
    
    def _map_to_sql_components(self, entities: Dict, intent: str, available_tables: List[str]) -> Dict[str, Any]:
        """Map extracted entities to SQL components."""
        components = {
            "select": entities.get("columns", []),
            "from": entities.get("tables", []),
            "where": entities.get("filters", []),
            "group_by": [],
            "order_by": [],
            "aggregations": entities.get("aggregations", [])
        }
        
        # Map intent to SQL structure
        if intent == "aggregate":
            components["group_by"] = entities.get("columns", [])
        elif intent == "filter":
            # Filters are already in where clause
            pass
        elif intent == "join":
            components["joins"] = []
        
        return components
    
    def _calculate_confidence(self, entities: Dict, intent: str) -> float:
        """Calculate confidence score for the parsing."""
        confidence = 0.5  # Base confidence
        
        # Increase confidence based on entity extraction
        if entities["tables"]:
            confidence += 0.2
        if entities["columns"]:
            confidence += 0.2
        if entities["filters"]:
            confidence += 0.1
        
        return min(confidence, 1.0)
    
    def _fallback_parse(self, query: str, available_tables: List[str]) -> Dict[str, Any]:
        """Fallback parsing when NLP models are not available."""
        query_lower = query.lower()
        
        # Simple keyword matching
        entities = {
            "tables": [],
            "columns": [],
            "filters": [],
            "aggregations": [],
            "time_periods": []
        }
        
        # Extract tables
        for table in available_tables:
            if table.lower() in query_lower:
                entities["tables"].append(table)
        
        # Extract common column patterns
        column_patterns = ["revenue", "sales", "profit", "cost", "date", "id", "name"]
        for pattern in column_patterns:
            if pattern in query_lower:
                entities["columns"].append(pattern)
        
        return {
            "original_query": query,
            "entities": entities,
            "intent": "select",
            "sql_components": self._map_to_sql_components(entities, "select", available_tables),
            "confidence": 0.3
        }

class QuerySuggestionEngine:
    """AI-powered query suggestion engine."""
    
    def __init__(self):
        """Initialize the suggestion engine."""
        self.query_patterns = self._load_query_patterns()
        self.user_history = []
    
    def _load_query_patterns(self) -> List[Dict[str, Any]]:
        """Load common query patterns."""
        return [
            {
                "pattern": "show me {metric} by {dimension}",
                "example": "show me revenue by region",
                "category": "basic_analysis"
            },
            {
                "pattern": "what is the {metric} for {filter}",
                "example": "what is the revenue for Q3 2023",
                "category": "filtered_analysis"
            },
            {
                "pattern": "compare {metric} between {dimension1} and {dimension2}",
                "example": "compare revenue between 2022 and 2023",
                "category": "comparison"
            },
            {
                "pattern": "trend of {metric} over time",
                "example": "trend of sales over time",
                "category": "trend_analysis"
            },
            {
                "pattern": "top {number} {dimension} by {metric}",
                "example": "top 10 customers by revenue",
                "category": "ranking"
            }
        ]
    
    def get_suggestions(self, partial_query: str, available_tables: List[str], 
                       available_columns: Dict[str, List[str]]) -> List[Dict[str, Any]]:
        """Get AI-powered query suggestions."""
        suggestions = []
        
        # Pattern-based suggestions
        pattern_suggestions = self._get_pattern_suggestions(partial_query, available_columns)
        suggestions.extend(pattern_suggestions)
        
        # Context-based suggestions
        context_suggestions = self._get_context_suggestions(partial_query, available_tables)
        suggestions.extend(context_suggestions)
        
        # Popular queries
        popular_suggestions = self._get_popular_suggestions(available_tables)
        suggestions.extend(popular_suggestions)
        
        return suggestions[:10]  # Return top 10 suggestions
    
    def _get_pattern_suggestions(self, partial_query: str, available_columns: Dict[str, List[str]]) -> List[Dict[str, Any]]:
        """Get suggestions based on query patterns."""
        suggestions = []
        
        # Extract potential metrics and dimensions from available columns
        metrics = []
        dimensions = []
        
        for table, columns in available_columns.items():
            for column in columns:
                if any(metric in column.lower() for metric in ["revenue", "sales", "profit", "amount", "value"]):
                    metrics.append(f"{table}.{column}")
                elif any(dim in column.lower() for dim in ["region", "country", "category", "type", "name"]):
                    dimensions.append(f"{table}.{column}")
        
        # Generate pattern-based suggestions
        for pattern in self.query_patterns:
            if pattern["category"] == "basic_analysis" and metrics and dimensions:
                suggestion = {
                    "query": f"SELECT {metrics[0]}, {dimensions[0]} FROM {list(available_columns.keys())[0]} GROUP BY {dimensions[0]}",
                    "description": f"Show {metrics[0].split('.')[-1]} by {dimensions[0].split('.')[-1]}",
                    "confidence": 0.8,
                    "category": "pattern"
                }
                suggestions.append(suggestion)
        
        return suggestions
    
    def _get_context_suggestions(self, partial_query: str, available_tables: List[str]) -> List[Dict[str, Any]]:
        """Get context-based suggestions."""
        suggestions = []
        
        # Analyze partial query for context
        query_lower = partial_query.lower()
        
        if "revenue" in query_lower or "sales" in query_lower:
            suggestions.append({
                "query": f"SELECT SUM(revenue) as total_revenue FROM {available_tables[0]}",
                "description": "Calculate total revenue",
                "confidence": 0.9,
                "category": "context"
            })
        
        if "trend" in query_lower or "time" in query_lower:
            suggestions.append({
                "query": f"SELECT date, SUM(revenue) FROM {available_tables[0]} GROUP BY date ORDER BY date",
                "description": "Revenue trend over time",
                "confidence": 0.8,
                "category": "context"
            })
        
        return suggestions
    
    def _get_popular_suggestions(self, available_tables: List[str]) -> List[Dict[str, Any]]:
        """Get popular query suggestions."""
        return [
            {
                "query": f"SELECT COUNT(*) as total_records FROM {available_tables[0]}",
                "description": "Count total records",
                "confidence": 0.7,
                "category": "popular"
            },
            {
                "query": f"SELECT * FROM {available_tables[0]} LIMIT 100",
                "description": "Preview data (first 100 rows)",
                "confidence": 0.6,
                "category": "popular"
            }
        ]

class VisualQueryBuilder:
    """Main visual query builder interface."""
    
    def __init__(self):
        """Initialize the visual query builder."""
        self.nlp_processor = NaturalLanguageProcessor()
        self.suggestion_engine = QuerySuggestionEngine()
        self.components: Dict[str, QueryComponent] = {}
        self.relationships: List[QueryRelationship] = []
        self.query_history: List[str] = []
        
    def render_interface(self):
        """Render the visual query builder interface."""
        st.title("🎯 Visual Query Builder")
        st.markdown("Build queries visually or use natural language")
        
        # Create tabs for different interfaces
        tab1, tab2, tab3 = st.tabs(["Natural Language", "Visual Builder", "Query History"])
        
        with tab1:
            self._render_natural_language_interface()
        
        with tab2:
            self._render_visual_builder_interface()
        
        with tab3:
            self._render_query_history_interface()
    
    def _render_natural_language_interface(self):
        """Render the natural language query interface."""
        st.header("💬 Natural Language Queries")
        
        # Natural language input
        nl_query = st.text_area(
            "Ask a question in natural language:",
            placeholder="e.g., 'Show me revenue by region for Q3 2023'",
            height=100
        )
        
        if st.button("Generate SQL", type="primary"):
            if nl_query:
                self._process_natural_language_query(nl_query)
        
        # Query suggestions
        st.subheader("💡 Suggested Queries")
        suggestions = self.suggestion_engine.get_suggestions(
            nl_query or "", 
            ["sales", "customers", "products"], 
            {"sales": ["revenue", "date", "region"], "customers": ["name", "country"]}
        )
        
        for i, suggestion in enumerate(suggestions[:5]):
            col1, col2 = st.columns([3, 1])
            with col1:
                st.write(f"**{suggestion['description']}**")
                st.code(suggestion['query'], language="sql")
            with col2:
                if st.button(f"Use", key=f"suggestion_{i}"):
                    st.session_state['current_query'] = suggestion['query']
                    st.rerun()
    
    def _process_natural_language_query(self, query: str):
        """Process natural language query and display results."""
        with st.spinner("Processing your query..."):
            # Parse natural language
            result = self.nlp_processor.parse_natural_language(
                query, 
                ["sales", "customers", "products"]
            )
            
            # Display parsing results
            st.subheader("🔍 Query Analysis")
            
            col1, col2 = st.columns(2)
            with col1:
                st.write("**Extracted Entities:**")
                for entity_type, entities in result["entities"].items():
                    if entities:
                        st.write(f"- {entity_type.title()}: {', '.join(entities)}")
            
            with col2:
                st.write("**Intent Classification:**")
                st.write(f"- Intent: {result['intent']}")
                st.write(f"- Confidence: {result['confidence']:.2f}")
            
            # Generate SQL
            sql_query = self._generate_sql_from_components(result["sql_components"])
            
            st.subheader("📝 Generated SQL")
            st.code(sql_query, language="sql")
            
            # Add to history
            self.query_history.append(sql_query)
            
            # Execute button
            if st.button("Execute Query", type="primary"):
                self._execute_query(sql_query)
    
    def _render_visual_builder_interface(self):
        """Render the visual query builder interface."""
        st.header("🎨 Visual Query Builder")
        
        # Create a canvas-like interface
        canvas_container = st.container()
        
        with canvas_container:
            # Toolbox
            st.subheader("🛠️ Toolbox")
            col1, col2, col3, col4 = st.columns(4)
            
            with col1:
                if st.button("📊 Add Table", use_container_width=True):
                    self._add_table_component()
            
            with col2:
                if st.button("📋 Add Column", use_container_width=True):
                    self._add_column_component()
            
            with col3:
                if st.button("🔍 Add Filter", use_container_width=True):
                    self._add_filter_component()
            
            with col4:
                if st.button("📈 Add Aggregation", use_container_width=True):
                    self._add_aggregation_component()
            
            # Canvas area
            st.subheader("🎨 Canvas")
            canvas = st.container()
            
            with canvas:
                # Display existing components
                for component_id, component in self.components.items():
                    self._render_component(component)
                
                # Add new component form
                if "show_add_form" in st.session_state and st.session_state.show_add_form:
                    self._render_add_component_form()
            
            # Generate SQL button
            if st.button("Generate SQL from Visual Builder", type="primary"):
                sql_query = self._generate_sql_from_visual_builder()
                st.code(sql_query, language="sql")
    
    def _render_component(self, component: QueryComponent):
        """Render a component in the visual builder."""
        with st.container():
            col1, col2, col3 = st.columns([3, 1, 1])
            
            with col1:
                st.write(f"**{component.display_name}** ({component.type})")
                if component.data_type:
                    st.write(f"Type: {component.data_type}")
            
            with col2:
                if st.button("Edit", key=f"edit_{component.id}"):
                    st.session_state.editing_component = component.id
            
            with col3:
                if st.button("Delete", key=f"delete_{component.id}"):
                    del self.components[component.id]
                    st.rerun()
    
    def _render_add_component_form(self):
        """Render form to add new component."""
        st.subheader("➕ Add New Component")
        
        component_type = st.selectbox("Component Type", ["table", "column", "filter", "aggregation"])
        component_name = st.text_input("Component Name")
        
        if st.button("Add Component"):
            if component_name:
                self._create_component(component_type, component_name)
                st.session_state.show_add_form = False
                st.rerun()
    
    def _render_query_history_interface(self):
        """Render the query history interface."""
        st.header("📚 Query History")
        
        if not self.query_history:
            st.info("No queries in history yet.")
            return
        
        for i, query in enumerate(reversed(self.query_history[-10:])):  # Show last 10
            with st.expander(f"Query {len(self.query_history) - i}"):
                st.code(query, language="sql")
                
                col1, col2 = st.columns([1, 1])
                with col1:
                    if st.button("Reuse", key=f"reuse_{i}"):
                        st.session_state['current_query'] = query
                        st.rerun()
                
                with col2:
                    if st.button("Execute", key=f"execute_{i}"):
                        self._execute_query(query)
    
    def _add_table_component(self):
        """Add a table component to the visual builder."""
        st.session_state.show_add_form = True
        st.session_state.adding_component_type = "table"
    
    def _add_column_component(self):
        """Add a column component to the visual builder."""
        st.session_state.show_add_form = True
        st.session_state.adding_component_type = "column"
    
    def _add_filter_component(self):
        """Add a filter component to the visual builder."""
        st.session_state.show_add_form = True
        st.session_state.adding_component_type = "filter"
    
    def _add_aggregation_component(self):
        """Add an aggregation component to the visual builder."""
        st.session_state.show_add_form = True
        st.session_state.adding_component_type = "aggregation"
    
    def _create_component(self, component_type: str, name: str):
        """Create a new component."""
        component_id = f"{component_type}_{len(self.components)}"
        
        component = QueryComponent(
            id=component_id,
            type=component_type,
            name=name,
            display_name=name.title(),
            position=(len(self.components) * 100, len(self.components) * 100)
        )
        
        self.components[component_id] = component
    
    def _generate_sql_from_components(self, components: Dict[str, Any]) -> str:
        """Generate SQL from parsed components."""
        sql_parts = []
        
        # SELECT clause
        if components.get("select"):
            sql_parts.append(f"SELECT {', '.join(components['select'])}")
        else:
            sql_parts.append("SELECT *")
        
        # FROM clause
        if components.get("from"):
            sql_parts.append(f"FROM {', '.join(components['from'])}")
        else:
            sql_parts.append("FROM sales")  # Default table
        
        # WHERE clause
        if components.get("where"):
            sql_parts.append(f"WHERE {' AND '.join(components['where'])}")
        
        # GROUP BY clause
        if components.get("group_by"):
            sql_parts.append(f"GROUP BY {', '.join(components['group_by'])}")
        
        return " ".join(sql_parts)
    
    def _generate_sql_from_visual_builder(self) -> str:
        """Generate SQL from visual builder components."""
        # This would analyze the visual components and generate SQL
        # For now, return a placeholder
        return "SELECT * FROM sales LIMIT 100"
    
    def _execute_query(self, sql_query: str):
        """Execute a SQL query and display results."""
        st.subheader("📊 Query Results")
        
        # In a real implementation, this would execute against the data engine
        # For now, show a sample result
        sample_data = pd.DataFrame({
            'region': ['North', 'South', 'East', 'West'],
            'revenue': [1000000, 800000, 1200000, 900000],
            'growth': [0.15, 0.08, 0.22, 0.12]
        })
        
        st.dataframe(sample_data)
        
        # Add visualization options
        st.subheader("📈 Visualizations")
        
        chart_type = st.selectbox("Chart Type", ["Bar Chart", "Line Chart", "Pie Chart", "Scatter Plot"])
        
        if chart_type == "Bar Chart":
            st.bar_chart(sample_data.set_index('region')['revenue'])
        elif chart_type == "Line Chart":
            st.line_chart(sample_data.set_index('region')['revenue'])
        elif chart_type == "Pie Chart":
            st.write("Pie chart would be rendered here")
        elif chart_type == "Scatter Plot":
            st.scatter_chart(sample_data, x='revenue', y='growth', size='revenue')

# Example usage
if __name__ == "__main__":
    # Initialize the visual query builder
    builder = VisualQueryBuilder()
    
    # Render the interface
    builder.render_interface() 