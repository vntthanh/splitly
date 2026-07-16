# Resource Plan - Splitly Project

## 1. Introduction
This document defines and allocates the necessary resources (human, tools, and equipment) to execute the **Splitly** project - a smart expense sharing and management application. The project is undertaken by a team of 6 third-year students from the University of Science (HCMUS), with the goal of building an optimized product starting from a manual entry workflow and evolving into an AI-integrated (receipt scanning) solution.

## 2. Human Resources: Roles & Responsibilities
The development team consists of 6 members. Given the nature of a student project, roles are distributed flexibly with cross-functional support. The specific roles are as follows:

| Role | Quantity | Main Responsibilities |
| --- | --- | --- |
| **Project Manager (PM) / BA** | 1 | Manages overall progress, distributes tasks, and coordinates resources. Primarily responsible for business documentation, User Stories, and workflows. |
| **UI/UX Designer / Frontend Dev** | 1 | Designs wireframes, mockups, and prototypes in Figma. Builds the frontend interface based on the design, ensuring a smooth UX for the user journey. |
| **Frontend Developer** | 1 | Focuses on user interface (UI) development, integrating split bill logic on the client-side, and connecting with Backend APIs. |
| **Backend Developer / AI Engineer** | 1 | Designs the Database and develops core APIs. Responsible for researching and integrating the OCR model (PaddleOCR/Tesseract) for receipt scanning. |
| **Backend Developer** | 1 | Supports API development, handles complex algorithms such as debt clearing logic, VietQR integration, and security measures. |
| **QA / Tester / DevOps** | 1 | Creates test cases and executes testing (Manual/Automation). Assists in setting up the CI/CD environment and deploying the application. |

## 3. Resource Allocation & Effort Estimation
**Working Hours:** 
Each member commits to dedicating approximately **4 days/week** to the project (estimated at 16 - 24 hours/week/person, depending on the university schedule).

**Weekly Effort Estimation:**
- **Total person-days per week:** 6 members × 4 days/week = **24 person-days/week**.
- The following is the estimated Effort Distribution and resource priority across the main phases of the project:

| Phase | BA / Design | Frontend | Backend & AI | QA & DevOps | Work Focus |
| --- | --- | --- | --- | --- | --- |
| **1. Initiation & Analysis** | High | Low | Low | Low | Finalize Requirements, DB & Figma design. |
| **2. Core Dev (Manual Entry)** | Low | High | High | Medium | Code core splitting logic, create APIs, assemble UI. |
| **3. Advanced Dev (AI OCR)** | Medium | High | High | Medium | Integrate receipt recognition (OCR) and VietQR API. |
| **4. Testing & Refinement** | Low | Medium | Medium | High | Fix bugs, UAT, evaluate AI accuracy. |

## 4. Development Environment & Tools
The project fully utilizes modern tools to increase team productivity, particularly with AI assistance:

* **AI Coding Assistants:** The team is equipped with **3 Codex accounts** to assist with coding. These accounts will be rotated or prioritized for 3 Developers (Frontend and Backend) during intensive coding phases to accelerate writing logic, generating test cases, and handling complex bill-splitting algorithms.
* **Project & Code Management:** GitHub (source code management, Issues, PRs), Notion/Trello (task management), Discord/Zalo (Communication).
* **Design:** Figma (Prototype and UI assets).
* **Core Tech Stack & AI:** React/Vue (Frontend), Node.js/Python (Backend & AI Services), PaddleOCR/Tesseract (OCR receipt recognition).

## 5. Resource Schedule
- **Initial Phase:** Resources are heavily focused on the Project Manager, UI/UX Design, and setting up the Backend/Database architecture. (The 3 Codex accounts can be used to generate boilerplate code).
- **Middle Phase (Core Development):** Frontend and Backend resources are operating at 100% capacity. The 3 Codex accounts are used continuously to accelerate the completion of the *Manual Entry* flow and *Debt Clearing* logic.
- **Final Phase (AI Integration & Testing):** Backend/AI focuses on OCR image processing and data extraction. The Tester operates at maximum capacity to evaluate AI accuracy and build fallback logic for cases where OCR misreads data.

## 6. Resource Risks & Mitigation

| Risk | Impact | Mitigation Strategy |
| --- | --- | --- |
| **Schedule conflicts with exams/other assignments** reducing actual work days (below 4 days/week). | High | Plan with buffer time. Accelerate progress during free weeks. Maximize the use of Codex to compensate for slower coding speeds during busy times. |
| **Conflicts when sharing 3 Codex accounts** among 4-5 developers. | Low | Establish a clear shift schedule (morning/afternoon/evening) or use screen sharing (Pair-programming) so 2 devs can share 1 account. |
| **Coding Bottlenecks**. | Medium | Organize Pair-programming (1 person dictates the algorithm, 1 person prompts Codex to generate code quickly). |
| **Lack of in-depth knowledge in AI/OCR integration** leading to excessive research time. | High | Allocate the AI Engineer to build Proof of Concepts (PoCs) from the very first week. Use Codex to ask for architectural suggestions for OCR. |
