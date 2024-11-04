const express = require('express');
const SibApiV3Sdk = require('sib-api-v3-sdk');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = 5000;

// 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 
let defaultClient = SibApiV3Sdk.ApiClient.instance;

let apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

// Enable CORS for frontend requests
app.use(cors());
app.use(express.json());

// Replace this with your Google Apps Script URL
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyk4rUUm415HB22Yw4rpv5gAHEmLxmmx4ELR5cnkfCUgyP4QTZJe5DcptJVgEL7oJ1U/exec";

// Endpoint to handle form submission from the frontend
app.post('/submit-to-sheets', async (req, res) => {
  try {
    const formData = req.body;

    // Forward the data to the Google Apps Script Web App
    const response = await axios.post(GOOGLE_APPS_SCRIPT_URL, formData, {
      headers: { 'Content-Type': 'application/json' }
    });

    let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    // Format formData as HTML for better readability in the email
    const formatFormDataAsHtml = (data) => {
      return Object.entries(data)
        .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
        .join('<br>');
    };

    const formattedFormData = formatFormDataAsHtml(formData);

    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = "Form Submission Notification";
    sendSmtpEmail.htmlContent = `<html><body><strong>A new form submission has been received:</strong><br>${formattedFormData}</body></html>`;
    sendSmtpEmail.sender = { "name": "RideAlongForm", "email": "ridealongform.project@gmail.com" };
    sendSmtpEmail.to = [{ "email": "ridealongform@gmail.com" }];


    apiInstance.sendTransacEmail(sendSmtpEmail).then(function(data) {
    console.log('Email sent:', data);
    }, function(error) {
    console.error(error);
    });

    // Respond back to the frontend with the result
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error forwarding data to Google Sheets:', error);
    res.status(500).json({ error: 'Failed to submit data to Google Sheets' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
