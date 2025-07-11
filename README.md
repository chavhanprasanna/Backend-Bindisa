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
- **Weather Integration** - Real-time weather data for Indian and global locations

## 🌦 Weather API Integration

This project integrates with the Indian Weather API to provide real-time weather data. The API requires authentication via API key.

### Authentication
Include your API key in the `x-api-key` header for all requests:
```
x-api-key: your_api_key_here
```

### India Weather

#### 1. Get Indian Cities
`GET /api/india/cities`

**Description:** Get a list of all available Indian cities with their IDs.

**Example Request:**
```http
GET /api/india/cities
x-api-key: your_api_key_here
```

**Example Response:**
```json
{
  "cities": [
    { "id": 1, "name": "Mumbai", "state": "Maharashtra" },
    { "id": 2, "name": "Delhi", "state": "Delhi" },
    // ... more cities
  ]
}
```

#### 2. Get Weather by City Name
`GET /api/india/weather?city=Mumbai`

**Parameters:**
- `city` (required): Name of the Indian city

**Example Request:**
```http
GET /api/india/weather?city=Mumbai
x-api-key: your_api_key_here
```

#### 3. Get Weather by City ID
`GET /api/india/weather_by_id?id=1`

**Parameters:**
- `id` (required): City ID from the cities list

### Global Weather

#### 1. Get Current Weather
`GET /api/global/current?q=London`

**Parameters:**
- `q` (required): City name or coordinates (lat,lon)
- `units` (optional): `metric` or `imperial` (default: metric)

#### 2. Get Weather Forecast
`GET /api/global/forecast?q=London&days=5`

**Parameters:**
- `q` (required): City name or coordinates
- `days` (optional): Number of forecast days (1-10, default: 3)
- `units` (optional): `metric` or `imperial`

### Error Responses

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Missing or invalid parameters |
| 401 | Unauthorized - Invalid or missing API key |
| 404 | Not Found - City not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

### Rate Limiting
- 60 requests per minute per API key
- 1,000 requests per day per API key

### API Configuration
Add the following to your `.env` file:
```
WEATHER_API_URL=https://weather.indianapi.in
WEATHER_API_KEY=your_api_key_here
```

**Important:** Never commit your actual API key to version control. The `.env` file is included in `.gitignore` by default.

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

### Authentication

#### 1. Request OTP
Send a 6-digit OTP to the provided phone number.

**Endpoint:** `POST /auth/request-otp`

**Request Body:**
```json
{
  "phoneNumber": "9356319754"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "otp": "123456"  // Only returned in development/staging for testing
}
```

**Error Responses:**
- `400 Bad Request`: Missing or invalid phone number
- `429 Too Many Requests`: Too many OTP requests
- `500 Internal Server Error`: Failed to send OTP

---

#### 2. Verify OTP
Verify the OTP and get authentication tokens.

**Endpoint:** `POST /auth/verify-otp`

**Request Body:**
```json
{
  "phoneNumber": "9356319754",
  "otp": "123456",
  "fullName": "User's Name",  // Required for new users
  "role": "FARMER"            // FARMER/AGENT/ADMIN
}
```

**Successful Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "needRegistration": false,
  "user": {
    "_id": "60d21b4667d0d8992e610c85",
    "phoneNumber": "9356319754",
    "fullName": "User's Name",
    "role": "FARMER",
    "isActive": true,
    "createdAt": "2025-07-09T08:00:44.638Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing or invalid OTP
- `401 Unauthorized`: Invalid or expired OTP
- `403 Forbidden`: Maximum verification attempts exceeded
- `500 Internal Server Error`: Server error during verification

**Note:** 
1. For new users, `fullName` and `role` are required in the request
2. The `accessToken` expires in 15 minutes
3. The `refreshToken` expires in 7 days
4. Include the `accessToken` in the `Authorization` header for protected routes:
   ```
   Authorization: Bearer <your_access_token>
   ```

### Available Endpoints

#### User Management

##### Get Current User Profile
**`GET /users/me`**

**Response:**
```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "phoneNumber": "9356319754",
  "fullName": "User's Name",
  "role": "FARMER",
  "isActive": true,
  "createdAt": "2025-07-09T08:00:44.638Z",
  "updatedAt": "2025-07-09T08:00:44.638Z"
}
```

##### Update User Profile
**`PUT /users/me`**

**Request Body:**
```json
{
  "fullName": "Updated Name",
  "profileImage": "https://example.com/profile.jpg"
}
```

**Response:** Updated user object

---

#### Farm Management

##### Create Farm
**`POST /farms`**

**Request Body:**
```json
{
  "farmName": "Green Valley Farm",
  "location": {
    "village": "Pune",
    "district": "Pune",
    "state": "Maharashtra",
    "latitude": 18.5204,
    "longitude": 73.8567
  },
  "sizeAcres": 10.5,
  "soilType": "Black Cotton"
}
```

**Response:** Created farm object with ID

##### List Farms
**`GET /farms`**

**Response:**
```json
[
  {
    "_id": "60d21b4667d0d8992e610c86",
    "farmName": "Green Valley Farm",
    "ownerId": "60d21b4667d0d8992e610c85",
    "sizeAcres": 10.5,
    "location": {
      "village": "Pune",
      "district": "Pune",
      "state": "Maharashtra",
      "geo": {
        "type": "Point",
        "coordinates": [73.8567, 18.5204]
      }
    },
    "createdAt": "2025-07-09T08:00:44.638Z"
  }
]
```

---

#### Crop Management

##### Create Crop Cycle
**`POST /api/v1/cycles`**

**Request Body:**
```json
{
  "farmId": "60d21b4667d0d8992e610c86",
  "cropName": "Wheat",
  "variety": "HD 2967",
  "plantingDate": "2025-11-01",
  "expectedHarvestDate": "2026-03-15",
  "areaInAcres": 5,
  "seedSource": "Local Market"
}
```

**Response:** Created crop cycle with ID

##### Get Farm Crop Cycles
**`GET /api/v1/cycles/farm/60d21b4667d0d8992e610c86`**

**Response:**
```json
[
  {
    "_id": "60d21b4667d0d8992e610c87",
    "farmId": "60d21b4667d0d8992e610c86",
    "cropName": "Wheat",
    "variety": "HD 2967",
    "plantingDate": "2025-11-01T00:00:00.000Z",
    "expectedHarvestDate": "2026-03-15T00:00:00.000Z",
    "status": "ACTIVE",
    "createdAt": "2025-07-09T08:00:44.638Z"
  }
]
```

---

#### Profit Tracking

##### Add Profit Entry
**`POST /profit-calculator`**

**Request Body:**
```json
{
  "farmId": "60d21b4667d0d8992e610c86",
  "cycleId": "60d21b4667d0d8992e610c87",
  "inputs": [
    {
      "name": "Seeds",
      "cost": 5000,
      "quantity": 100,
      "unit": "kg"
    },
    {
      "name": "Fertilizer",
      "cost": 3000,
      "quantity": 10,
      "unit": "bags"
    }
  ],
  "outputs": [
    {
      "name": "Wheat Grains",
      "quantity": 5000,
      "unit": "kg",
      "sellingPrice": 20
    }
  ],
  "date": "2026-03-20"
}
```

**Response:** Created profit entry with calculated profit

##### List Profit Entries
**`GET /profit-calculator`**

**Response:**
```json
[
  {
    "_id": "60d21b4667d0d8992e610c88",
    "farmId": "60d21b4667d0d8992e610c86",
    "cycleId": "60d21b4667d0d8992e610c87",
    "totalCost": 8000,
    "totalRevenue": 100000,
    "profit": 92000,
    "date": "2026-03-20T00:00:00.000Z",
    "createdAt": "2025-07-09T08:00:44.638Z"
  }
]
```

---

#### Support

##### Start New Chat
**`POST /support/chat`**

**Request Body:**
```json
{
  "subject": "Issue with crop suggestions",
  "message": "The app is not showing accurate crop recommendations for my soil type."
}
```

##### Submit Bug Report
**`POST /support/bug-reports`**

**Request Body:**
```json
{
  "title": "App crashes when adding new farm",
  "description": "The app crashes immediately after clicking 'Add Farm' button.",
  "stepsToReproduce": [
    "Open the app",
    "Go to Farms",
    "Click 'Add New Farm'"
  ],
  "deviceInfo": {
    "os": "Android 13",
    "appVersion": "1.2.3",
    "deviceModel": "Samsung Galaxy S21"
  }
}
```

#### Weather
- `GET /api/india/cities` - List Indian cities
- `GET /api/india/weather?city=Mumbai` - Get weather by city
- `GET /api/global/current?q=London` - Get global weather

### Postman Collection
Complete API documentation is available as a Postman collection: `AgriTech_API.postman_collection.json`

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
