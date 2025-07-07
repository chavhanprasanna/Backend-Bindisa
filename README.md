# AgriTech Backend API

[![Node.js](https://img.shields.io/badge/Node.js-18.x-brightgreen)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-7.x-red)](https://redis.io/)
[![Jest](https://img.shields.io/badge/Jest-29.x-yellow)](https://jestjs.io/)

A robust backend API for AgriTech applications, providing features for farm management, crop analysis, and user support.

## 🌟 Features

- **User Authentication** - Secure JWT-based authentication system
- **Farm Management** - Track multiple farms, crops, and activities
- **Crop Analysis** - Get AI-powered crop suggestions and analysis
- **Soil Testing** - Record and analyze soil test results
- **Profit Tracking** - Monitor farm profitability with detailed entries
- **Offline Support** - Sync data when connection is restored
- **Support System** - Integrated chat and bug reporting
- **Video Tutorials** - Educational content for farmers

## 🛠 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Caching**: Redis
- **Testing**: Jest
- **Containerization**: Docker
- **API Documentation**: Postman Collection included

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- MongoDB 6.0 or higher
- Redis 7.0 or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/chavhanprasanna/Backend-Bindisa.git
   cd Backend-Bindisa
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your configuration.

4. Start the development server:
   ```bash
   npm run dev
   ```

### Docker Setup

```bash
# Build and start containers
docker-compose up --build

# Run in detached mode
docker-compose up -d
```

## 📚 API Documentation

API documentation is available as a Postman collection in the root directory: `AgriTech_API.postman_collection.json`

## 🧪 Testing

Run tests using:
```bash
npm test
```

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Contact

Project Link: [https://github.com/chavhanprasanna/Backend-Bindisa](https://github.com/chavhanprasanna/Backend-Bindisa)

## 🙏 Acknowledgments

- All contributors who have helped shape this project
- Open source libraries and tools used in this project
