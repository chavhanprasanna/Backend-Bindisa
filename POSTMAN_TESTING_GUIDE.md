# 🚀 Backend API Testing Guide - Postman

## Base URL
```
http://localhost:5000
```

## 📋 Step-by-Step Testing Checklist

### 1. 🏥 **Server Health Check**
**Method:** `GET`  
**URL:** `http://localhost:5000`  
**Expected Response:** Server should respond (might be 404, but server is running)

---

### 2. 📱 **OTP Request - Email**
**Method:** `POST`  
**URL:** `http://localhost:5000/api/otp/request`  
**Headers:**
```json
{
  "Content-Type": "application/json"
}
```
**Body (JSON):**
```json
{
  "identifier": "test@example.com",
  "type": "login"
}
```
**Expected Response:** `200 OK` or `201 Created`
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresAt": "2025-07-19T19:05:00.000Z",
  "method": "email",
  "testMode": false
}
```

---

### 3. 📞 **OTP Request - Phone Number**
**Method:** `POST`  
**URL:** `http://localhost:5000/api/otp/request`  
**Headers:**
```json
{
  "Content-Type": "application/json"
}
```
**Body (JSON):**
```json
{
  "identifier": "+919876543210",
  "type": "login"
}
```
**Expected Response:** `200 OK`, `201 Created`, or `503 Service Unavailable` (if Firebase not configured)

---

### 4. ✅ **OTP Verification**
**Method:** `POST`  
**URL:** `http://localhost:5000/api/otp/verify`  
**Headers:**
```json
{
  "Content-Type": "application/json"
}
```
**Body (JSON):**
```json
{
  "identifier": "test@example.com",
  "otp": "123456",
  "type": "login"
}
```
**Expected Response:** `200 OK` or `400 Bad Request` (invalid OTP)

---

### 5. 🔄 **OTP Resend**
**Method:** `POST`  
**URL:** `http://localhost:5000/api/otp/resend`  
**Headers:**
```json
{
  "Content-Type": "application/json"
}
```
**Body (JSON):**
```json
{
  "identifier": "test@example.com",
  "type": "login"
}
```
**Expected Response:** `200 OK` or rate limit error

---

## 🚨 Error Testing

### 6. **Validation Error - Invalid Email**
**Method:** `POST`  
**URL:** `http://localhost:5000/api/otp/request`  
**Body (JSON):**
```json
{
  "identifier": "invalid-email",
  "type": "login"
}
```
**Expected Response:** `400 Bad Request`
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed"
  }
}
```

### 7. **Validation Error - Missing Fields**
**Method:** `POST`  
**URL:** `http://localhost:5000/api/otp/request`  
**Body (JSON):**
```json
{}
```
**Expected Response:** `400 Bad Request`

### 8. **404 Error - Unknown Route**
**Method:** `GET`  
**URL:** `http://localhost:5000/api/unknown-route`  
**Expected Response:** `404 Not Found`

### 9. **Method Not Allowed**
**Method:** `GET`  
**URL:** `http://localhost:5000/api/otp/request`  
**Expected Response:** `405 Method Not Allowed` or `404 Not Found`

---

## 🔒 Security Testing

### 10. **Rate Limiting Test**
Make 5-10 rapid requests to:
**Method:** `POST`  
**URL:** `http://localhost:5000/api/otp/request`  
**Body:** Same email/phone multiple times
**Expected:** Some requests should return `429 Too Many Requests`

### 11. **CORS Headers Check**
**Method:** `OPTIONS`  
**URL:** `http://localhost:5000/api/otp/request`  
**Headers:**
```json
{
  "Origin": "http://localhost:3000",
  "Access-Control-Request-Method": "POST"
}
```
**Expected:** CORS headers in response

---

## 📊 **What to Look For**

### ✅ **Success Indicators:**
- Server responds to all requests (no connection errors)
- Proper HTTP status codes (200, 201, 400, 404, etc.)
- JSON responses with consistent structure
- Validation errors for invalid data
- Rate limiting working
- Security headers present

### ❌ **Failure Indicators:**
- Connection refused errors
- 500 Internal Server Error
- Inconsistent response formats
- No validation on invalid data
- Missing security headers

---

## 🎯 **Quick Test Sequence**

1. **Health Check** → Should respond
2. **Valid Email OTP** → Should succeed
3. **Valid Phone OTP** → Should succeed or gracefully fail
4. **Invalid Email** → Should return 400
5. **Missing Data** → Should return 400
6. **Unknown Route** → Should return 404

---

## 📝 **Sample Postman Collection**

You can import this as a Postman collection:

```json
{
  "info": {
    "name": "Backend API Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:5000",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000"
        }
      }
    },
    {
      "name": "OTP Request - Email",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"identifier\": \"test@example.com\",\n  \"type\": \"login\"\n}"
        },
        "url": {
          "raw": "http://localhost:5000/api/otp/request",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "otp", "request"]
        }
      }
    }
  ]
}
```

---

## 🔧 **Troubleshooting**

### If you get connection errors:
1. Check if server is running: `npm run dev`
2. Verify port 5000 is not blocked
3. Check console for error messages

### If you get 500 errors:
1. Check server logs in terminal
2. Verify database connections (MongoDB, Redis)
3. Check environment variables

### If validation isn't working:
1. Verify request headers include `Content-Type: application/json`
2. Check JSON syntax in request body
3. Ensure all required fields are present

---

## 🎉 **Success Criteria**

Your backend is working perfectly if:
- ✅ All basic requests return appropriate responses
- ✅ Validation errors are handled properly
- ✅ Rate limiting is active
- ✅ Security headers are present
- ✅ No 500 internal server errors
- ✅ Consistent JSON response format

**Your backend is now ready for frontend integration! 🚀**
