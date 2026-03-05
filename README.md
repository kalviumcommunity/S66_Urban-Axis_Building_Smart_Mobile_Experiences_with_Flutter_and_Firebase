# UrbanAxis

A multi-tenant SaaS platform for managing residential community facilities — gyms, pools, halls, parking, and more.

![Flutter](https://img.shields.io/badge/Flutter-02569B?style=flat&logo=flutter&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)
![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=flat&logo=google-cloud&logoColor=white)
![Status](https://img.shields.io/badge/Status-In_Development-yellow)

---

## Overview

UrbanAxis gives residents, service staff, and community managers a unified platform to handle facility access, complaints, announcements, and operational control — with real-time updates and multi-community support.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Flutter (Android, iOS, Web) |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Backend Logic | Firebase Cloud Functions |
| Notifications | Firebase Cloud Messaging |
| File Storage | Firebase Cloud Storage |
| Infrastructure | Google Cloud Platform |

---

## Architecture

\`\`\`
Flutter Client
     ↓
Firebase Authentication
     ↓
Cloud Functions  ←→  Cloud Firestore
     ↓
Google Cloud Infrastructure
\`\`\`

Sensitive operations run through Cloud Functions; read operations go directly through Firestore with security rules enforced.

---

## User Roles

| Role | Description |
|---|---|
| **SuperAdmin** | Community manager — manages residents, services, admins, announcements, and documents |
| **Admin** | Service staff — manages occupancy, notices, and complaints for assigned facilities |
| **Resident** | Verified community member — views services, checks in/out, submits complaints |

---

## Features

- Real-time facility occupancy tracking
- Resident check-in / check-out
- Complaint submission and status tracking
- Community announcements and notifications
- Document management (rules, guidelines, policies)
- Role-based access control
- Multi-tenant data isolation per community

---

## Data Model

Core Firestore collections:

\`communities\` · \`users\` · \`services\` · \`serviceLogs\` · \`serviceNotices\` · \`complaints\` · \`notifications\` · \`documents\` · \`auditLogs\`

Every document is scoped by \`communityId\` to enforce tenant isolation.

---

## Status

Currently in active development — initial architecture and system design phase.

Upcoming:
- [ ] Flutter UI implementation
- [ ] Firestore schema setup
- [ ] Cloud Functions logic
- [ ] Security rules configuration
- [ ] Production deployment

---

## License

To be added.
