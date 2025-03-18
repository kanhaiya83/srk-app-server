import admin, { ServiceAccount }  from 'firebase-admin'
import {config}  from 'dotenv'
config()

const serviceAccount = {
    "type": "service_account",
    "project_id": "srk-auction-86a90",
    "private_key_id": "f6eec3ed97ba5f76703c44f9444d73eac6b150c8",
    "private_key": process.env.FIREBASE_PRIVATE_KEY,
    "client_email": "firebase-adminsdk-fbsvc@srk-auction-86a90.iam.gserviceaccount.com",
    "client_id": "109663606567632511689",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40srk-auction-86a90.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
  }
  
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
  databaseURL: 'https://your-database-name.firebaseio.com'
});
