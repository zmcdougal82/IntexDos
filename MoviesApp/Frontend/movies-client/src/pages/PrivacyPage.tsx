import React from "react";

const PrivacyPage: React.FC = () => {
  return (
    <div className="container">
      <div
        className="card mt-5 mb-5"
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          lineHeight: "1.6",
          padding: "var(--spacing-xl)",
        }}
      >
        <h1
          style={{
            color: "var(--color-primary)",
            marginBottom: "var(--spacing-lg)",
            textAlign: "center",
          }}
        >
          Privacy Policy
        </h1>

        <section style={{ marginBottom: "var(--spacing-xl)" }}>
          <h2 style={{ color: "var(--color-text)", fontSize: "1.6rem" }}>
            Introduction
          </h2>
          <p>
            At CineNiche, we respect your privacy and are committed to
            protecting your personal data. This Privacy Policy explains how we
            collect, use, and safeguard your information when you use our
            service.
          </p>
        </section>

        <section style={{ marginBottom: "var(--spacing-xl)" }}>
          <h2 style={{ color: "var(--color-text)", fontSize: "1.6rem" }}>
            Information We Collect
          </h2>
          <p>We collect the following types of information:</p>
          <ul style={{ paddingLeft: "var(--spacing-lg)" }}>
            <li className="mb-2">
              <strong>Personal Information:</strong> Name, email address, and
              password when you create an account.
            </li>
            <li className="mb-2">
              <strong>Profile Information:</strong> Age, gender, location, and
              streaming service preferences you choose to provide.
            </li>
            <li className="mb-2">
              <strong>Usage Data:</strong> Information about how you interact
              with our service, including movies viewed and ratings submitted.
            </li>
            <li className="mb-2">
              <strong>Device Information:</strong> IP address, browser type, and
              device identifiers.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: "var(--spacing-xl)" }}>
          <h2 style={{ color: "var(--color-text)", fontSize: "1.6rem" }}>
            How We Use Your Information
          </h2>
          <ul style={{ paddingLeft: "var(--spacing-lg)" }}>
            <li className="mb-2">To provide and maintain our service</li>
            <li className="mb-2">
              To personalize your experience and provide movie recommendations
            </li>
            <li className="mb-2">To improve our website and user experience</li>
            <li className="mb-2">
              To communicate with you about service-related announcements
            </li>
            <li className="mb-2">To detect and prevent fraudulent activity</li>
          </ul>
        </section>

        <section style={{ marginBottom: "var(--spacing-xl)" }}>
          <h2 style={{ color: "var(--color-text)", fontSize: "1.6rem" }}>
            Data Retention
          </h2>
          <p>
            We retain your personal data only for as long as necessary to
            fulfill the purposes for which it was collected, including to
            provide our services, comply with legal obligations, resolve
            disputes, and enforce our agreements. The retention periods for
            different types of data are as follows:
          </p>
          <ul style={{ paddingLeft: "var(--spacing-lg)" }}>
            <li className="mb-2">
              Account Information (e.g., name, email, password): Retained for as
              long as your account remains active. If you delete your account,
              we will delete or anonymize your data within 30 days, unless we
              are legally required to retain it.
            </li>
            <li className="mb-2">
              Profile Information (e.g., age, gender, preferences): Retained
              while your account is active and deleted or anonymized within 30
              days of account deletion.
            </li>
            <li className="mb-2">
              Usage Data (e.g., movie views, ratings): Retained for up to 12
              months after collection for the purposes of analytics and service
              improvement, unless you request deletion earlier.
            </li>
            <li className="mb-2">
              Device and Technical Data (e.g., IP address, browser type):
              Retained for up to 12 months for security and performance
              optimization.
            </li>
          </ul>
          <p>
            We may retain certain data longer if required by law or to protect
            our legitimate business interests, such as in the event of a legal
            dispute.
          </p>
        </section>

        <section style={{ marginBottom: "var(--spacing-xl)" }}>
          <h2 style={{ color: "var(--color-text)", fontSize: "1.6rem" }}>
            Data Security
          </h2>
          <p>
            We implement appropriate security measures to protect your personal
            information. However, no method of transmission over the Internet or
            electronic storage is 100% secure. While we strive to use
            commercially acceptable means to protect your personal data, we
            cannot guarantee its absolute security.
          </p>
        </section>

        <section style={{ marginBottom: "var(--spacing-xl)" }}>
          <h2 style={{ color: "var(--color-text)", fontSize: "1.6rem" }}>
            GDPR Compliance
          </h2>
          <p>
            For users in the European Economic Area (EEA), we ensure compliance
            with the General Data Protection Regulation (GDPR). This includes
            providing the following rights:
          </p>
          <ul style={{ paddingLeft: "var(--spacing-lg)" }}>
            <li className="mb-2">The right to access your personal data</li>
            <li className="mb-2">
              The right to rectify inaccurate personal data
            </li>
            <li className="mb-2">
              The right to erasure ("right to be forgotten")
            </li>
            <li className="mb-2">
              The right to restrict processing of your personal data
            </li>
            <li className="mb-2">The right to data portability</li>
            <li className="mb-2">
              The right to object to processing of your personal data
            </li>
          </ul>
          <p>
            To exercise any of these rights, please contact us at
            privacy@cinestream.com.
          </p>
        </section>

        <section style={{ marginBottom: "var(--spacing-xl)" }}>
          <h2 style={{ color: "var(--color-text)", fontSize: "1.6rem" }}>
            Legal Basis for Processing
          </h2>
          <p>
            We process your personal data in accordance with the General Data
            Protection Regulation (GDPR) and rely on the following legal bases:
          </p>
          <ul style={{ paddingLeft: "var(--spacing-lg)" }}>
            <li className="mb-2">Performance of a Contract</li>
            <p>
              We process your personal data to provide you with our services,
              including account creation, access to our platform, and
              personalized movie recommendations based on your preferences and
              usage. This processing is necessary to fulfill our contractual
              obligations to you.
            </p>
            <li className="mb-2">Consent</li>
            <p>
              Where required, we rely on your consent to process certain types
              of data, such as your profile information (e.g., gender, age,
              streaming preferences) and for sending you promotional
              communications. You can withdraw your consent at any time by
              contacting us at privacy@cineniche.com.
            </p>
            <li className="mb-2">Legitimate Interests</li>
            <p>
              We may process your data when it is necessary for our legitimate
              interests, provided those interests are not overridden by your
              rights and freedoms. These interests include improving our
              service, preventing fraud, and ensuring the security of our
              platform.
            </p>
            <li className="mb-2">Compliance with Legal Obligations</li>
            <p>
              In some cases, we may be required to process your personal data to
              comply with applicable laws or regulatory requirements.
            </p>
          </ul>
          <p>
            If you have any questions about the legal basis for processing your
            data, feel free to contact us at privacy@cineniche.com.
          </p>
        </section>

        <section style={{ marginBottom: "var(--spacing-xl)" }}>
          <h2 style={{ color: "var(--color-text)", fontSize: "1.6rem" }}>
            Cookies
          </h2>
          <p>
            We use cookies and similar tracking technologies to track activity
            on our service and hold certain information. Cookies are files with
            a small amount of data that may include an anonymous unique
            identifier. You can instruct your browser to refuse all cookies or
            to indicate when a cookie is being sent.
          </p>
        </section>

        <section style={{ marginBottom: "var(--spacing-xl)" }}>
          <h2 style={{ color: "var(--color-text)", fontSize: "1.6rem" }}>
            Changes to This Privacy Policy
          </h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page
            and updating the "Last Updated" date below.
          </p>
          <p>
            <strong>Last Updated:</strong> April 9, 2025
          </p>
        </section>

        <section>
          <h2 style={{ color: "var(--color-text)", fontSize: "1.6rem" }}>
            Contact Us
          </h2>
          <p>
            The data controller responsible for the processing of your personal
            data under this Privacy Policy is:
          </p>
          <address
            style={{ lineHeight: "1.6", fontStyle: "normal", margin: "1rem 0" }}
          >
            <strong>CineNiche Media Ltd.</strong>
            <br />
            850 Streamline St., Suite 200
            <br />
            Los Angeles, CA 90028
            <br />
            United States
          </address>
          <p>
            If you have any questions about how your data is handled or would
            like to exercise your data protection rights, please contact us at:
            <b>privacy@cineniche.com</b>
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
