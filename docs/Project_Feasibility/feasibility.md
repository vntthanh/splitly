# Feasibility Study - Splitly Project

## 1. Executive Summary
- **Document Objective:** To assess the viability and potential for success of the **Splitly** project — a smart expense-sharing platform tailored for the Vietnamese market (positioned for the Naver AI Hackathon and Software Project Management coursework).
- **Quick Conclusion (Go/No-go):** The project is **Highly Feasible (Go)** based on the existing technical foundation (MERN Stack), the resources of 6 students (empowered by AI Codex tools), and a solution that perfectly addresses a real-world need (splitting bills via VietQR with automatic debt simplification).

## 2. Technical Feasibility
*Analysis of Tech Stack capabilities and technological solutions:*
- **Frontend (React 19, Vite, Material-UI, Tailwind, Redux):** These are popular, well-documented technologies that make it easy to build responsive, smooth, and highly optimized User Interfaces (UX) across both Mobile and Desktop devices.
- **Backend & Database (Node.js, Express, MongoDB):** The traditional MERN stack architecture is more than capable of scaling to handle thousands of concurrent bill-splitting transactions.
- **Real-time (Socket.IO):** A perfect and feasible solution for direct notifications when someone creates a bill, updates an invoice, or confirms a payment.
- **AI & OCR (Clova Studio, PaddleOCR/Tesseract):** 
  - *Difficulty/Risk:* Processing messy, unstructured Vietnamese receipts to extract information is the most challenging aspect of the project.
  - *Feasible Solution:* Implement a "Human-in-the-loop" mechanism (using AI to scan and create a draft, then forcing users to review and manually correct data) to mitigate AI inaccuracies. Clova Studio API will be integrated as a Chatbot to assist users with inquiries.

## 3. Schedule & Resource Feasibility
*Assessment of the team's execution capacity:*
- **Human Resources:** 6 third-year students from the University of Science (HCMUS). The team's maturity in logical thinking, coding, and teamwork meets the project's requirements well.
- **Time/Schedule:** A commitment of 4 working days per week per person is a massive advantage, providing sufficient time (roughly 24 person-days/week) to handle complex flows like AI Integration and Debt Clearing.
- **Technological Leverage (3 Codex Accounts):** Having 3 AI Coding assistant accounts is a **key factor** that significantly boosts schedule feasibility. The team can accelerate writing boilerplate code, automatically generate test cases, and figure out complex bill-splitting algorithms 2-3 times faster than normal. The deadline is completely attainable.

## 4. Operational & Market Feasibility
*Assessment of end-user acceptance:*
- **Real-world Problem:** The pain points of splitting dining bills (the payer must collect the receipt, manually calculate taxes/fees, remind everyone to pay, and verify bank transfers).
- **Splitly's Solution:** 100% localized for Vietnamese culture, integrates VietQR, and utilizes automatic debt simplification algorithms.
- **Acceptance Rate:** Students and young office workers are currently very accustomed to scanning QR codes and splitting money. Consolidating the workflow from "scanning receipts -> calculating splits -> generating VietQR" into a single app ensures extremely high Operational Feasibility.

## 5. Economic Feasibility
*Assessment of setup and operational costs (from a student project/Hackathon perspective):*
- **Hosting/Database Costs:** Can fully utilize MongoDB Atlas (Free Tier) and Vercel/Render for Frontend/Backend servers — Costs are practically $0.
- **External API Costs (Brevo Email, Clova Studio):** Leveraging Brevo's Free-tier (300 emails/day) and sponsorship credits from the Naver AI Hackathon.
- **Tools Costs (Codex):** Already purchased/invested (sunk cost).
- **Conclusion:** The project has exceptionally low operational costs, bringing the financial risk margin close to zero.

## 6. Legal & Ethical Feasibility
- **Data Security:** Utilizing JWT Tokens and Bcrypt password hashing meets standard security requirements for a modern Web App. Receipt information and debt history are kept secure.
- **Financial Laws (Critical):** Splitly **does not** hold user funds, nor does it allow cash deposits/withdrawals (it is not an E-wallet). The system merely generates Napas-standard VietQR codes so users can open their own banking apps to transfer money.
- *Conclusion:* This design allows the project to completely bypass strict regulations regarding Fintech or Payment Intermediary licenses from the State Bank of Vietnam. It is highly legally secure.

## 7. Recommendations
The **Splitly project meets all Feasibility criteria** for immediate development. The team should:
1. Quickly deploy a PoC (Proof of Concept) for the Vietnamese OCR Receipt Scanning feature.
2. Establish clear rules for sharing the 3 Codex accounts to maximize the coding efficiency of all 6 members without creating bottlenecks.
