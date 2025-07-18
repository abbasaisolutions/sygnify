const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function testUpload() {
    console.log('🧪 Testing Upload Endpoint\n');
    
    try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream('./test-data/empty-file.csv'));
        formData.append('domain', 'finance');
        
        console.log('Sending request to http://localhost:3000/api/v1/upload');
        
        const response = await axios.post('http://localhost:3000/api/v1/upload', formData, {
            headers: {
                ...formData.getHeaders()
            },
            timeout: 10000
        });
        
        console.log('✅ Success Response:');
        console.log(JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log('❌ Error Response:');
        console.log('Status:', error.response?.status);
        console.log('Status Text:', error.response?.statusText);
        console.log('Data:', JSON.stringify(error.response?.data, null, 2));
        console.log('Message:', error.message);
    }
}

testUpload().catch(console.error); 