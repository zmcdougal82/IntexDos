import React from 'react';

const PrivacyPage: React.FC = () => {
  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      lineHeight: '1.6',
      color: '#333'
    }}>
      <h1 style={{ color: '#0078d4', marginBottom: '20px' }}>Privacy Policy</h1>
      
      <section style={{ marginBottom: '30px' }}>
        <h2>Introduction</h2>
        <p>
          At Movies App, we respect your privacy and are committed to protecting your personal data. 
          This Privacy Policy explains how we collect, use, and safeguard your information when you use our service.
        </p>
      </section>
      
      <section style={{ marginBottom: '30px' }}>
        <h2>Information We Collect</h2>
        <p>We collect the following types of information:</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Personal Information:</strong> Name, email address, and password when you create an account.</li>
          <li><strong>Profile Information:</strong> Age, gender, location, and streaming service preferences you choose to provide.</li>
          <li><strong>Usage Data:</strong> Information about how you interact with our service, including movies viewed and ratings submitted.</li>
          <li><strong>Device Information:</strong> IP address, browser type, and device identifiers.</li>
        </ul>
      </section>
      
      <section style={{ marginBottom: '30px' }}>
        <h2>How We Use Your Information</h2>
        <ul style={{ paddingLeft: '20px' }}>
          <li>To provide and maintain our service</li>
          <li>To personalize your experience and provide movie recommendations</li>
          <li>To improve our website and user experience</li>
          <li>To communicate with you about service-related announcements</li>
          <li>To detect and prevent fraudulent activity</li>
        </ul>
      </section>
      
      <section style={{ marginBottom: '30px' }}>
        <h2>Data Security</h2>
        <p>
          We implement appropriate security measures to protect your personal information. 
          However, no method of transmission over the Internet or electronic storage is 100% secure.
          While we strive to use commercially acceptable means to protect your personal data,
          we cannot guarantee its absolute security.
        </p>
      </section>
      
      <section style={{ marginBottom: '30px' }}>
        <h2>GDPR Compliance</h2>
        <p>
          For users in the European Economic Area (EEA), we ensure compliance with the General Data Protection Regulation (GDPR).
          This includes providing the following rights:
        </p>
        <ul style={{ paddingLeft: '20px' }}>
          <li>The right to access your personal data</li>
          <li>The right to rectify inaccurate personal data</li>
          <li>The right to erasure ("right to be forgotten")</li>
          <li>The right to restrict processing of your personal data</li>
          <li>The right to data portability</li>
          <li>The right to object to processing of your personal data</li>
        </ul>
        <p>
          To exercise any of these rights, please contact us at privacy@moviesapp.com.
        </p>
      </section>
      
      <section style={{ marginBottom: '30px' }}>
        <h2>Cookies</h2>
        <p>
          We use cookies and similar tracking technologies to track activity on our service and
          hold certain information. Cookies are files with a small amount of data that may include
          an anonymous unique identifier. You can instruct your browser to refuse all cookies or to
          indicate when a cookie is being sent.
        </p>
      </section>
      
      <section style={{ marginBottom: '30px' }}>
        <h2>Changes to This Privacy Policy</h2>
        <p>
          We may update our Privacy Policy from time to time. We will notify you of any changes by
          posting the new Privacy Policy on this page and updating the "Last Updated" date below.
        </p>
        <p><strong>Last Updated:</strong> April 7, 2025</p>
      </section>
      
      <section>
        <h2>Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at:
          privacy@moviesapp.com
        </p>
      </section>
    </div>
  );
};

export default PrivacyPage;
