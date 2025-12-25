# 🔥 FlameWall

> Modern, full-stack social platform for Minecraft gaming communities

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

A complete, production-ready social platform for Minecraft servers featuring clans, real-time chat integration, achievements, web store, and more.

**🆓 Free & Open Source** | **💼 [Commercial Licenses Available](COMMERCIAL.md)**

---

> **📜 License Notice:** This project is free and open-source under the **GNU AGPL v3**.
> 
> * **For Community:** You can use, modify, and run this for your Minecraft server for free. No license needed.
> * **For Hosting Providers:** If you plan to sell instances of this software or offer it as a service (SaaS), you **must** comply with AGPL v3 (open source your infrastructure code) OR purchase a commercial license. Violators will be prosecuted.
> 
> See [COMMERCIAL.md](COMMERCIAL.md) for details.

<!-- Screenshots coming soon -->

---

## ⚡ Features

### 👥 Social Features
- **User Profiles** - Customizable profiles with stats, achievements, and activity feeds
- **Posts & Comments** - Rich text editor with images, nested comments, voting system
- **Private Messaging** - Real-time DMs with read receipts and notifications
- **Friendships** - Friend requests, friend lists, and mutual friend discovery
- **Activity Feed** - Personalized feed of posts from friends and followed users

### 🛡️ Advanced Clan System
- **Clan Management** - Create and manage clans with custom branding
- **Role Hierarchy** - Granular permission system with custom roles
- **Clan Chat** - Private real-time chat for clan members
- **Applications** - Customizable application forms for new members
- **Moderation Tools** - Kick, ban, mute, warn with full audit logs
- **Clan Reviews** - Public rating and review system

### 🎮 Minecraft Integration
- **Live Status** - Real-time online/offline status synced from game
- **Chat Bridge** - Bidirectional chat between web and in-game
- **Account Linking** - Secure Minecraft account connection system
- **Rank Sync** - Web purchases automatically applied in-game
- **Achievement Sync** - Track in-game achievements on the website

### 🔥 Real-Time Game Integration
- **Bidirectional Chat** - Message players from web, receive messages in-game via WebSocket
- **Live Status Sync** - See who's online in real-time, updated instantly
- **Instant Rank Updates** - Web purchases applied immediately in-game (no delays)
- **Achievement Tracking** - In-game achievements sync to web profile in real-time
- **Cross-Platform Messaging** - Private messages work seamlessly between web and game

### 🏆 Progression System
- **Achievements** - Customizable achievement system with progress tracking
- **Multi-server Support** - Track achievements across multiple game servers
- **Rewards** - Automatic rewards upon achievement completion

### 🛒 Web Store
- **Ranks** - Sell server ranks with instant in-game delivery
- **Items** - Virtual items delivered via plugin
- **Payment Integration** - Ready for Stripe/PayPal integration
- **Purchase History** - Full transaction tracking

### 📰 Content Management
- **News System** - Publish announcements with rich formatting
- **Custom Pages** - Create static pages (rules, guides, etc.)
- **Dynamic Navigation** - Customizable menu structure
- **SEO Friendly** - Meta tags and sitemap support

### 🔧 Admin Features
- **Admin Dashboard** - User management, moderation, analytics
- **Ban System** - Temporary and permanent bans with reasons
- **Settings Panel** - Customize site appearance and behavior
- **Notification System** - Push notifications (PWA support)

### 🎨 Modern Tech Stack
- **Backend:** NestJS, TypeScript, TypeORM, PostgreSQL, Passport.js (JWT), Socket.IO
- **Frontend:** React 19, React Router, Material-UI, Tailwind CSS, Socket.IO Client
- **Deployment:** Docker, Docker Compose, Nginx, SSL ready
- **Real-time:** WebSocket-based live updates
- **PWA:** Installable as mobile/desktop app

---

## 📸 Screenshots

[Add screenshots of key features: dashboard, clan system, chat, store, admin panel]

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git
- (Windows users: WSL 2 recommended)

### Installation

```bash
# 1. Clone repository
git clone https://github.com/Sknery/FlameWall-public-release.git
cd FlameWall

# 2. Copy environment file
cp .env.example .env
# Edit .env with your configuration

# 3. Start services
docker-compose up --build -d

# 4. Access application
# Website: http://localhost:5173
# API: http://localhost:3000
# API Docs: http://localhost:3000/api-docs
```

**Full installation guide:** [See detailed setup instructions below](#first-time-setup--installation)

---

## ⚠️ Project Status

**Stable / Maintenance Mode**

This project is feature-complete and production-ready, but no longer in active development.

✅ **What I'll do:**
- Fix critical bugs
- Review important PRs
- Respond to commercial license inquiries

❌ **What I won't do:**
- Add new features (fork it if you want)
- Provide free support/consulting
- Debug your custom modifications
- Test everything (it's huge, I'm solo)

💼 **Interested in commercial partnership?** Email business@flamewall.io

This is a massive codebase built solo. Use at your own risk.
If you find it useful, consider starring ⭐ or sponsoring.

---

## 📄 License & Commercial Use

### 🆓 Free Use (AGPL v3)

FlameWall is **free and open source** for:
- ✅ Personal Minecraft servers
- ✅ Community/non-profit use
- ✅ Educational purposes
- ✅ Contributing to the project

### 💼 Commercial Use

Need to:
- Sell or resell FlameWall?
- Offer as SaaS or managed hosting?
- White-label without attribution?
- Keep modifications private?

**[See Commercial Licensing Options →](COMMERCIAL.md)**

Starting at $500. Flexible licenses for agencies, hosting companies, and enterprises.

---

## ⚠️ Anti-Scam Notice

**Found FlameWall being sold on mc-market, SpigotMC, or elsewhere?**

🚨 **You're being scammed!** FlameWall is FREE and open source.

Report scammers to: scam-report@flamewall.io

---

## Core Technologies
- **Backend:** NestJS, TypeScript, TypeORM, PostgreSQL, Passport.js (JWT), Socket.IO, Class-Validator
- **Frontend:** React, React Router, Material-UI (Joy UI), Axios, Socket.IO Client
- **Environment:** Docker, Docker Compose

## Prerequisites
- Docker Desktop
- Git
- **For Windows Users:** An installed and working **WSL 2** subsystem is required. It is *highly recommended* to work from within the WSL 2 filesystem to avoid common issues.

## First-Time Setup & Installation

1.  **Clone the Repository:**
    *For Windows users, it is best to execute these commands inside a WSL terminal (e.g., Ubuntu), not in PowerShell or CMD.*
    ```bash
    git clone https://github.com/Sknery/FlameWall-public-release.git
    cd FlameWall
    ```

2.  **Create the Configuration File:**
    In the project root, you will find a `.env.example` file. Create a copy of it and name the copy `.env`.
    ```bash
    cp .env.example .env
    ```
    Now, open the new `.env` file and replace all placeholder values (e.g., `your_secret_password` or `replace_this...`) with your actual secret values.

3.  **Install Dependencies:**
    This needs to be done once for both the backend and the frontend.
    ```bash
    # Install backend dependencies
    cd backend
    npm install
    cd ..

    # Install frontend dependencies
    cd frontend
    npm install
    cd ..
    ```

4.  **Launch the Project:**
    This single command will build the Docker images (on first launch) and start all services in detached mode.
    ```bash
    docker-compose up --build -d
    ```

## Accessing the Services

Once successfully launched, the application services will be available at the following addresses:
- **Website (Frontend):** [http://localhost:5173](http://localhost:5173)
- **API (Backend):** [http://localhost:3000](http://localhost:3000)
- **API Documentation (Swagger):** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **PgAdmin (DB Management):** [http://localhost:5050](http://localhost:5050) (use the email and password from your `.env` file to log in)

## Stopping the Project
To stop all running containers, use:
```bash
docker-compose down
```

---

## 💬 Community & Support

### Free Community Support

- **📖 [Documentation](https://github.com/Sknery/FlameWall-public-release/wiki)** - Setup guides, tutorials, troubleshooting
- **💭 [GitHub Discussions](https://github.com/Sknery/FlameWall-public-release/discussions)** - Ask questions, share ideas
- **🐛 [Issue Tracker](https://github.com/Sknery/FlameWall-public-release/issues)** - Bug reports only

> **Note:** This is a community project maintained in free time. Response times vary. 
> Community members help each other. No SLA or guaranteed support.

### Paid Services

Need help with setup?
- **Installation Services** - Starting at $50 (one-time)
- **[See all options →](COMMERCIAL.md)**

---

## 🤝 Contributing

Contributions are welcome! Whether it's:
- 🐛 Bug fixes
- ✨ New features
- 📖 Documentation improvements
- 🌍 Translations

**[Read Contributing Guidelines](CONTRIBUTING.md)** (to be created)

### Top Contributors

[//]: # (Add contributor badges here)

---

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Discord bot integration
- [ ] Multi-language support
- [ ] Theme marketplace
- [ ] GraphQL API option

**[View full roadmap →](https://github.com/Sknery/FlameWall-public-release/projects)**

---

## 💖 Support the Project

If FlameWall saves you time and money, consider supporting:

- ⭐ **Star this repo** - It helps with visibility
- 💼 **[Commercial License](COMMERCIAL.md)** - For business use

Every contribution helps keep this project alive and maintained.

---

## 📧 Contact

- **General Questions:** hello@flamewall.io
- **Commercial Licensing:** business@flamewall.io
- **Security Issues:** security@flamewall.io (private disclosure)
- **Scam Reports:** scam-report@flamewall.io

**Response time:** 1-3 business days (free support may be slower or community-driven)

---

## Important for Windows Users (Solving the `EIO` Error)

If your containers are constantly restarting with an `EIO: i/o error` in the logs, this is a known issue with Docker Desktop's file-watching capabilities on Windows.

**The guaranteed solution is to place and run the project from *within the WSL2 filesystem*, not from your Windows `C:\` drive.**

**How to do it:**
1. Open your Ubuntu terminal (or other WSL distro).
2. Navigate to your home directory with `cd ~`.
3. Clone the repository here: `git clone https://github.com/Sknery/FlameWall.git`.
4. Navigate into the project folder: `cd FlameWall`.
5. Open the project in VS Code by running the command `code .` (this will launch VS Code in a special remote-development mode connected to WSL).
6. From there, follow the standard installation instructions (create `.env`, run `docker-compose up`).

---

## 📜 License

**FlameWall** is licensed under [GNU AGPL v3](LICENSE).

### What this means:

✅ **FREE to use** for your Minecraft server (personal/community/non-profit)  
✅ **FREE to modify** and customize  
✅ **FREE to self-host**  

⚠️ **If you modify and distribute:** You MUST share your source code (AGPL v3 requirement)  
⚠️ **If you offer as SaaS:** You MUST share source code with your users  

❌ **You CANNOT:** Take this code, rebrand it, and sell as proprietary software without a commercial license

### Commercial Use

For selling, white-labeling, SaaS, or closed-source modifications:  
**[Get Commercial License →](COMMERCIAL.md)** (starts at $500)

---

## 🙏 Acknowledgments

Built with amazing open source projects:
- [NestJS](https://nestjs.com/) - Backend framework
- [React](https://react.dev/) - Frontend library
- [TypeORM](https://typeorm.io/) - Database ORM
- [Socket.IO](https://socket.io/) - Real-time engine
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components

And many more. See [package.json](backend/package.json) for full list.

---

## ⚖️ Legal

**Disclaimer:** FlameWall is provided "as-is" without warranty of any kind. Use at your own risk.

**Minecraft:** Minecraft is a trademark of Mojang AB. FlameWall is not affiliated with Mojang AB or Microsoft.

**DMCA:** If you find FlameWall being sold or distributed illegally, report to: scam-report@flamewall.io

---

<div align="center">

**Made with ❤️ (and lots of ☕) for the Minecraft community**

[⭐ Star this repo](https://github.com/Sknery/FlameWall-public-release) • [🐛 Report Bug](https://github.com/Sknery/FlameWall-public-release/issues) • [💡 Request Feature](https://github.com/Sknery/FlameWall-public-release/discussions) • [💼 Commercial License](COMMERCIAL.md)

Copyright © 2025 FlameWall Contributors

</div>