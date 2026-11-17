// Terms of Service. Marketplace terms aligned with the Consumer Protection Act 2019 and
// Consumer Protection (E-Commerce) Rules 2020 (seller info, refunds, grievance officer),
// the IT Act 2000 intermediary framework, and Indian contract law. Courts: Mangaluru.
import { B, LegalPage, Mail, P, Table, Ul, type LegalSection } from "@/components/legal";
import { CONTACT, UPDATED } from "@/lib/legal";

const sections: LegalSection[] = [
  {
    id: "about", title: "About these terms",
    body: [
      <P key="a">These terms are an agreement between you and CareBridge, a <B>student project that is not yet an incorporated company</B>. By creating an account or using the website or app you agree to them and to our Privacy Policy. If you do not agree, please do not use CareBridge.</P>,
    ],
  },
  {
    id: "service", title: "What CareBridge is, and is not",
    body: [
      <P key="a">CareBridge is an online marketplace. We help families find independent caregivers, nurses and therapists, book and pay for their time, keep medical records organised, and follow each visit.</P>,
      <Ul key="b" items={[
        <>Caregivers are <B>independent professionals</B>. They are not our employees or agents, and they are responsible for the care they provide.</>,
        <>CareBridge <B>does not provide medical care, diagnosis or treatment</B>, and nothing in the app is medical advice.</>,
        <>CareBridge is <B>not an emergency service</B>. In an emergency call <B>112</B> (or <B>108</B> for an ambulance).</>,
      ]} />,
    ],
  },
  {
    id: "eligibility", title: "Who can use it",
    body: [
      <Ul key="a" items={[
        "You must be at least 18 and able to enter a binding contract under Indian law.",
        "Information you give must be accurate, and you must keep it up to date.",
        "If you add an older relative, you confirm they agree or that you are legally entitled to act for them.",
        "Caregivers must hold the qualifications and registrations they claim, and must be legally permitted to work in India.",
      ]} />,
    ],
  },
  {
    id: "accounts", title: "Your account",
    body: [
      <P key="a">Keep your password private and tell us at <Mail to={CONTACT} /> if you think your account has been misused. You are responsible for activity on your account. You can delete your account at any time by writing to us.</P>,
    ],
  },
  {
    id: "verification", title: "Caregiver verification",
    body: [
      <P key="a">We review caregivers' qualifications and show their verification and background-check status. Verification is a <B>reasonable check, not a guarantee</B> of anyone's skill, honesty or conduct. Please meet caregivers, check references, and stay involved in your parent's care.</P>,
    ],
  },
  {
    id: "bookings", title: "Bookings and payment",
    body: [
      <Ul key="a" items={[
        "Caregivers set their hourly and daily rates. The price for each booking is calculated by CareBridge and shown before you pay. Weekly plans are 10% and monthly plans 20% below the daily rate.",
        "All prices are in Indian Rupees. Any applicable taxes are shown before payment.",
        "Payments are processed by Razorpay. A booking is confirmed only once payment succeeds.",
        "While CareBridge is a project in testing, payments may run in Razorpay test mode or as a simulation. In that case no real money changes hands and no real care is arranged.",
      ]} />,
    ],
  },
  {
    id: "refunds", title: "Cancellations and refunds",
    body: [
      <Table key="t" head={["Situation", "Refund"]} rows={[
        ["You cancel 24 hours or more before the start", "Full refund."],
        ["You cancel less than 24 hours before the start", "Full refund minus the first hour (hourly plans) or the first day (other plans), which is paid to the caregiver."],
        ["You cancel after care has started", "Refund for unused full days. Hours and days already worked are not refunded."],
        ["The caregiver cancels or does not arrive", "Full refund for the missed time, and we will help you find a replacement."],
        ["Care was not provided as booked", "Write to the Grievance Officer within 7 days. We review visit records and decide fairly."],
      ]} />,
      <P key="b">Refunds go back to the original payment method, normally within 5 to 7 working days after approval.</P>,
    ],
  },
  {
    id: "records", title: "Medical records and AI",
    body: [
      <Ul key="a" items={[
        "You are responsible for the documents you upload and must have the right to share them.",
        "AI summaries, extracted medicines and caregiver matches can contain mistakes. Always check them against the original documents and with a doctor before acting on them.",
        "You control who sees records through the Sharing tab. Booked caregivers get summary access automatically; you can change or revoke it at any time.",
        "The Health ID card shows emergency information to anyone who scans it. Keep it safe and tell us if it is lost.",
      ]} />,
    ],
  },
  {
    id: "caregivers", title: "Caregiver responsibilities",
    body: [
      <Ul key="a" items={[
        "Provide care safely, with reasonable skill, and only within your qualifications.",
        "Check in when you arrive and check out when you leave; the location is recorded.",
        "Report tasks, vitals and notes honestly.",
        "Keep patient information confidential and use it only to provide the booked care.",
        "Do not ask families to pay outside CareBridge for bookings made through it.",
      ]} />,
    ],
  },
  {
    id: "conduct", title: "Things you must not do",
    body: [
      <Ul key="a" items={[
        "Harass, abuse, neglect or endanger anyone.",
        "Upload false, misleading or someone else's information without permission.",
        "Post fake reviews or manipulate ratings.",
        "Try to access data you are not allowed to see, or disrupt or reverse-engineer the service.",
        "Use CareBridge for anything unlawful.",
      ]} />,
    ],
  },
  {
    id: "content", title: "Your content",
    body: [
      <P key="a">You own what you upload. You give CareBridge a limited licence to store, process and display it only to run the service for you, as described in the Privacy Policy. Reviews you post may be shown publicly with your first name and initial.</P>,
    ],
  },
  {
    id: "ip", title: "Our content",
    body: [
      <P key="a">The CareBridge name, design, software and original content belong to the CareBridge team. You may use them only to use the service.</P>,
    ],
  },
  {
    id: "third", title: "Other services",
    body: [
      <P key="a">CareBridge relies on third parties such as Razorpay, Supabase and Groq. Their own terms apply to their services, and we are not responsible for their acts beyond what the law requires of us.</P>,
    ],
  },
  {
    id: "liability", title: "Disclaimers and liability",
    body: [
      <P key="a">CareBridge is provided "as is" while it is being built and tested. To the extent Indian law allows:</P>,
      <Ul key="b" items={[
        "We are not liable for the acts, omissions or care of independent caregivers, or for decisions made using AI summaries.",
        "We are not liable for indirect or consequential losses.",
        "Our total liability to you for any claim is limited to the amount you paid through CareBridge in the 3 months before the claim, or ₹5,000, whichever is higher.",
      ]} />,
      <P key="c">Nothing here limits liability that cannot be limited by law, or your rights as a consumer under the Consumer Protection Act, 2019.</P>,
    ],
  },
  {
    id: "indemnity", title: "Indemnity",
    body: [
      <P key="a">If you break these terms or the law and someone makes a claim against CareBridge because of it, you agree to cover the reasonable losses and costs that result.</P>,
    ],
  },
  {
    id: "termination", title: "Suspension and termination",
    body: [
      <P key="a">We may suspend or close an account that breaks these terms, puts anyone at risk, or must be closed by law. Where reasonable we will tell you why and give you a chance to respond. You may stop using CareBridge at any time.</P>,
    ],
  },
  {
    id: "law", title: "Governing law and disputes",
    body: [
      <P key="a">These terms are governed by the laws of India. Please raise any issue with our Grievance Officer first; most problems can be solved quickly. Subject to your rights to approach consumer commissions, the courts at <B>Mangaluru, Karnataka</B> have exclusive jurisdiction.</P>,
    ],
  },
  {
    id: "grievance", title: "Grievance Officer and contact",
    body: [
      <Table key="t" head={["", ""]} rows={[
        ["Operated by", "CareBridge (student project, not yet incorporated)"],
        ["Grievance Officer", "Grievance Officer, CareBridge"],
        ["Email", <Mail key="m" to={CONTACT} />],
        ["Response", "Acknowledged within 48 hours, resolved within one month."],
      ]} />,
    ],
  },
  {
    id: "changes", title: "Changes to these terms",
    body: [
      <P key="a">We may update these terms. We will post the new version here with a new date, and tell you in the app about important changes. If you keep using CareBridge after a change, the new terms apply.</P>,
    ],
  },
];

export default function Terms() {
  return (
    <LegalPage
      kicker="The ground rules"
      title="Terms of Service"
      updated={UPDATED}
      other={{ href: "/privacy", label: "Privacy Policy" }}
      intro={<P>These terms explain how CareBridge works, what you can expect from us and from caregivers, how bookings, payments and refunds work, and how disputes are handled.</P>}
      sections={sections}
    />
  );
}
