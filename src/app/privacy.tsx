// Privacy Policy. Written to the Digital Personal Data Protection Act 2023 and DPDP Rules 2025,
// the IT (Reasonable Security Practices ... Sensitive Personal Data) Rules 2011, and the
// Consumer Protection (E-Commerce) Rules 2020 grievance requirements.
import { B, LegalPage, Mail, P, Table, Ul, type LegalSection } from "@/components/legal";

import { CONTACT, UPDATED } from "@/lib/legal";

const sections: LegalSection[] = [
  {
    id: "who", title: "Who we are",
    body: [
      <P key="a">CareBridge is an elder-care platform that helps families find home caregivers, keep a parent's medical records organised, share them with care, and follow each visit. It is currently a <B>student project and is not yet an incorporated company</B>. For this policy, "CareBridge", "we" and "us" mean the team that operates the service, acting as the <B>Data Fiduciary</B> under India's Digital Personal Data Protection Act, 2023 ("DPDP Act").</P>,
      <P key="b">"You" means anyone who uses CareBridge: family members, caregivers, nurses and administrators. The older person whose care is managed is the "patient".</P>,
    ],
  },
  {
    id: "data", title: "Personal data we collect",
    body: [
      <P key="a">We collect only what the service needs. Health information is "sensitive personal data" under the Information Technology Rules, 2011, and we treat it with extra care.</P>,
      <Table key="t" head={["What we collect", "Examples"]} rows={[
        ["Account details", "Name, email, phone number, city, password (stored only as a secure hash by our authentication provider), and whether you are a family member or caregiver."],
        ["Patient profile", "Name, date of birth, gender, blood group, address, allergies, conditions, medicines, care needs and an emergency contact."],
        ["Medical documents", "Prescriptions, lab reports and discharge summaries you upload, and the information our AI extracts from them."],
        ["Caregiver profile", "Qualifications, certificates, experience, languages, specialisations, rates, availability and verification status."],
        ["Bookings and payments", "Dates, plan, price, status and payment reference numbers. Card, UPI and bank details are handled by Razorpay and never reach our servers."],
        ["Visit records", "Check-in and check-out times and GPS location, tasks completed, vitals, mood and notes written by the caregiver."],
        ["Reviews and messages", "Ratings, review text and in-app notifications."],
        ["Technical data", "Sign-in session tokens, device and browser type, and server logs used for security and troubleshooting."],
      ]} />,
      <P key="b">The camera is used on your device to scan Health ID codes and to photograph documents you choose to upload. Scanned frames are decoded on your device and are not stored.</P>,
    ],
  },
  {
    id: "purposes", title: "Why we use it",
    body: [
      <P key="a">We process personal data on the basis of your <B>consent</B>, given when you create an account and when you add or upload information, and for limited "legitimate uses" the DPDP Act allows (such as complying with law or responding to a medical emergency).</P>,
      <Ul key="b" items={[
        "Run your account and keep it secure.",
        "Show caregivers to families, and match caregivers to a patient's recorded needs.",
        "Read uploaded medical documents with AI to extract medicines, allergies, lab values and care needs, and write plain-language summaries.",
        "Take bookings, collect payment through Razorpay, and issue refunds.",
        "Record visits and deliver daily care reports and notifications to the family.",
        "Verify caregivers and handle complaints, disputes and safety issues.",
        "Produce de-identified, aggregated statistics (for example, how many patients have diabetes in a city). These cannot identify anyone.",
        "Meet legal obligations, including tax and accounting record-keeping.",
      ]} />,
      <P key="c">We do <B>not</B> sell personal data, use it for advertising, or share it with data brokers.</P>,
    ],
  },
  {
    id: "behalf", title: "Information about your parent",
    body: [
      <P key="a">Families usually add information about an older relative. By doing so you confirm that the patient has agreed, or that you are legally entitled to act for them (for example as their lawful guardian or under a valid authority). Where a patient has a disability that affects their ability to consent, the DPDP Act requires consent from their lawful guardian.</P>,
      <P key="b">The patient, or anyone lawfully acting for them, can exercise every right in section 9 directly with us.</P>,
    ],
  },
  {
    id: "sharing", title: "Who can see it",
    body: [
      <Ul key="a" items={[
        <><B>Caregivers you book</B> automatically get <B>Summary</B> access to the patient: AI summary, allergies, medicines and care needs. You can upgrade a caregiver to <B>Full</B> access (all documents) or revoke access at any time from the patient's Sharing tab. Revocation takes effect immediately.</>,
        <><B>Anyone holding the patient's Health ID card</B> can scan it to see emergency information only: name, age, blood group, allergies, current medicines, conditions and the emergency contact. Full records stay private. Contact us to reset a lost card.</>,
        <><B>CareBridge administrators</B> can access records only to verify caregivers, resolve disputes, investigate safety concerns or meet legal duties.</>,
        <><B>Authorities</B> when required by Indian law, a court order, or to protect someone's life in an emergency.</>,
      ]} />,
      <P key="b">Access is enforced in the database itself (row-level security), not only in the app.</P>,
    ],
  },
  {
    id: "processors", title: "Service providers we use",
    body: [
      <P key="a">These companies process data on our behalf under contract, only for the purposes below.</P>,
      <Table key="t" head={["Provider", "What they do"]} rows={[
        ["Supabase", "Database, sign-in and file storage. Data is stored in Amazon Web Services' Mumbai region (India)."],
        ["Groq", "AI processing of uploaded documents and caregiver matching. Document text or images are sent for processing and are not used by us to train models. Processing may take place in the United States."],
        ["Razorpay", "Payment collection and refunds in India."],
        ["Vercel", "Hosting and delivery of the website through a global network."],
        ["Expo", "Building and updating the Android app. Receives no patient data."],
      ]} />,
      <P key="b">The DPDP Act allows transfers outside India except to countries the Government restricts. We will stop any transfer that becomes restricted.</P>,
    ],
  },
  {
    id: "retention", title: "How long we keep it",
    body: [
      <Ul key="a" items={[
        "Account, patient and caregiver data: while your account is active. When you delete your account, or withdraw consent, we erase it within 30 days unless the law requires us to keep it.",
        "Uploaded documents: until you delete them or your account is closed.",
        "Booking and payment records: for the period required by Indian tax and accounting law (generally up to 8 years).",
        "Security and access logs: at least one year, as the DPDP Rules require, then deleted.",
        "De-identified statistics may be kept because they no longer relate to any person.",
      ]} />,
    ],
  },
  {
    id: "security", title: "How we protect it",
    body: [
      <Ul key="a" items={[
        "Encryption in transit (HTTPS) and at rest by our hosting providers.",
        "Row-level security so each person can only reach the records they are allowed to see.",
        "Private document storage with short-lived links (5 minutes) for viewing files.",
        "Passwords are never stored in readable form.",
        "Access to production systems is limited to the people who need it.",
      ]} />,
      <P key="b">If a personal data breach occurs, we will inform affected people without delay, in plain language, with what happened, the likely impact and what we are doing, and we will report it to the Data Protection Board of India as the DPDP Rules require (including a detailed report within 72 hours).</P>,
    ],
  },
  {
    id: "rights", title: "Your rights",
    body: [
      <P key="a">Under the DPDP Act you can:</P>,
      <Ul key="b" items={[
        <><B>Access</B> a summary of the personal data we hold about you and who we have shared it with.</>,
        <><B>Correct, complete or update</B> inaccurate or incomplete data. Most of it you can edit in the app.</>,
        <><B>Erase</B> data that is no longer needed, or delete your account.</>,
        <><B>Withdraw consent</B> at any time, as easily as you gave it. This does not affect processing already done, and some features may stop working.</>,
        <><B>Nominate</B> someone to exercise your rights if you die or become unable to.</>,
        <><B>Raise a grievance</B> with us, and if unresolved, complain to the Data Protection Board of India.</>,
      ]} />,
      <P key="c">Email <Mail to={CONTACT} /> from your registered address. We may ask you to confirm your identity. We respond within the times in section 11.</P>,
    ],
  },
  {
    id: "children", title: "Children",
    body: [
      <P key="a">CareBridge is for adults. You must be 18 or older to create an account. We do not knowingly collect data about children; if we learn we have, we will delete it.</P>,
    ],
  },
  {
    id: "grievance", title: "Grievance Officer",
    body: [
      <P key="a">Questions, requests and complaints about privacy, or about any purchase on CareBridge, go to our Grievance Officer:</P>,
      <Table key="t" head={["", ""]} rows={[
        ["Designation", "Grievance Officer, CareBridge"],
        ["Email", <Mail key="m" to={CONTACT} />],
        ["Response", "We acknowledge every complaint within 48 hours and aim to resolve it within 30 days."],
      ]} />,
      <P key="b">If you are not satisfied, you may complain to the Data Protection Board of India, or, for consumer issues, approach the National Consumer Helpline (1915) or the consumer commissions under the Consumer Protection Act, 2019.</P>,
    ],
  },
  {
    id: "ai", title: "About AI features",
    body: [
      <P key="a">AI summaries and matches are aids, not medical advice. They can be wrong. Always check medicines, doses and allergies against the original document and with a doctor. CareBridge does not diagnose or treat anyone.</P>,
    ],
  },
  {
    id: "changes", title: "Changes to this policy",
    body: [
      <P key="a">We will post any change here and update the date at the top. If a change affects how we use your data in a significant way, we will tell you in the app and ask for fresh consent where the law requires it.</P>,
    ],
  },
];

export default function Privacy() {
  return (
    <LegalPage
      kicker="Your data, your family"
      title="Privacy Policy"
      updated={UPDATED}
      other={{ href: "/terms", label: "Terms of Service" }}
      intro={<P>This explains what personal data CareBridge collects, why, who can see it, how long we keep it, and the rights you have under Indian law. We have tried to write it plainly. If anything is unclear, email <Mail to={CONTACT} />.</P>}
      sections={sections}
    />
  );
}
