const axios = require("axios");

async function testLogin() {
    try {
        const res = await axios.post("http://localhost:5000/api/auth/login", {
            email: "admin@pos.com",
            password: "admin123"
        });
        console.log("Login Success!");
        console.log("Token:", res.data.token ? "Present" : "Missing");
        console.log("User:", JSON.stringify(res.data.user));
    } catch (err) {
        console.error("Login Failed!");
        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Data:", JSON.stringify(err.response.data));
        } else {
            console.error("Error:", err.message);
        }
    }
}

testLogin();
