# 🇲🇾 polarsou - Easy Bill Splitting for Malaysia

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green.svg)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **polarsou** is a comprehensive bill splitting application designed specifically for Malaysian users, featuring smart SST calculations, local payment method integration, and receipt OCR scanning.

## ✨ Features

### 🧮 Smart Calculations
- **Malaysian SST (6%)** automatic calculations
- **Service charge (10%)** handling
- **Multi-currency support** with MYR as default
- **Real-time balance calculations**

### 💳 Payment Integration
- **TouchNGo eWallet** deep links
- **GrabPay** payment integration
- **DuitNow QR** code generation
- **Malaysian bank transfers** (Maybank, CIMB, Public Bank)

### 📱 Mobile-First Design
- **Progressive Web App (PWA)** support
- **Offline functionality** with local storage
- **Responsive design** for all devices
- **Touch-optimized** interface

### 🔐 Authentication
- **Email/Password** traditional signup
- **Google Sign-In** social authentication
- **Facebook Login** social authentication
- **Guest mode** for quick sessions

### 📄 Receipt Processing
- **OCR scanning** with Tesseract.js
- **Automatic item extraction** from receipts
- **Malaysian receipt format** optimization
- **Manual item addition** as fallback

### 🔗 Session Management
- **Shareable links** for easy collaboration
- **Real-time updates** across devices
- **Participant management** with roles
- **Session history** for registered users

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for backend)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/TerenceTan/polarsou.git
   cd polarsou
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_APP_URL=http://localhost:5173
   ```

4. **Database setup**
   ```bash
   # Run the SQL migration in your Supabase dashboard
   # File: database/migrations/001_initial_schema.sql
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:5173
   ```

## 🏗️ Project Structure

```
polarsou/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── auth/           # Authentication components
│   │   ├── payment/        # Payment method components
│   │   ├── ocr/           # Receipt scanning components
│   │   ├── tax/           # Tax calculation components
│   │   └── ui/            # Base UI components (shadcn/ui)
│   ├── contexts/           # React contexts
│   ├── pages/             # Main application pages
│   ├── services/          # Business logic and API calls
│   ├── utils/             # Utility functions
│   │   ├── malaysian/     # Malaysia-specific utilities
│   │   └── payment/       # Payment processing utilities
│   ├── types/             # TypeScript type definitions
│   └── __tests__/         # Test files
├── database/              # Database migrations and schema
├── public/               # Static assets
└── docs/                # Documentation
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🏭 Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🚀 Deployment

### Option 1: Vercel (Recommended)

1. **Connect to Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Set environment variables in Vercel dashboard**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_URL`

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Option 2: cPanel/Traditional Hosting

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Upload `dist/` folder contents** to your web hosting
3. **Configure `.htaccess`** (included in build)
4. **Update environment variables** for production

### Option 3: Netlify

1. **Connect repository** to Netlify
2. **Set build command**: `npm run build`
3. **Set publish directory**: `dist`
4. **Configure environment variables**

## ⚙️ Configuration

### Supabase Setup

1. **Create a new Supabase project**
2. **Run database migrations** from `database/migrations/`
3. **Configure authentication providers** (Google, Facebook)
4. **Set up email templates** (see `SUPABASE_EMAIL_SETUP.md`)
5. **Update site URL** to your production domain

### Email Configuration

See `SUPABASE_EMAIL_SETUP.md` for detailed email setup instructions including:
- Custom SMTP configuration
- Email template customization
- Domain verification
- Social authentication setup

## 🇲🇾 Malaysian Features

### Tax Calculations
- **SST (Sales and Service Tax)**: 6% on applicable items
- **Service Charge**: 10% on restaurant bills
- **Tax-exempt items**: Proper handling of non-taxable items

### Payment Methods
- **TouchNGo**: Deep link integration for seamless payments
- **GrabPay**: Direct payment link generation
- **DuitNow QR**: QR code generation for bank transfers
- **Bank Transfers**: Support for major Malaysian banks

### Localization
- **Malaysian Ringgit (MYR)** as default currency
- **Malaysian English** language support
- **Local time zone** (Asia/Kuala_Lumpur)
- **Malaysian phone number** validation

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Add tests** for new functionality
5. **Run tests**
   ```bash
   npm test
   ```
6. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
7. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
8. **Open a Pull Request**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** for the excellent backend-as-a-service platform
- **Tailwind CSS** for the utility-first CSS framework
- **shadcn/ui** for the beautiful UI components
- **Tesseract.js** for OCR functionality
- **Lucide React** for the icon library

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/TerenceTan/polarsou/issues)
- **Discussions**: [GitHub Discussions](https://github.com/TerenceTan/polarsou/discussions)

## 🗺️ Roadmap

- [ ] **Multi-language support** (Bahasa Malaysia, Chinese, Tamil)
- [ ] **Expense tracking** and analytics
- [ ] **Group management** for recurring bills
- [ ] **Integration with Malaysian banks** for direct payments
- [ ] **Mobile app** (React Native)
- [ ] **API for third-party integrations**

---

**Made with ❤️ for Malaysian users**

*polarsou - Making bill splitting easy, one ringgit at a time! 🇲🇾*

