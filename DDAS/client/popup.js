document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const loginStatus = document.getElementById("login-status");

  // Handle login submission
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok) {
        loginStatus.textContent = "Login successful!";
        loginStatus.style.color = "green";

        // Store the userId in local storage
        chrome.storage.local.set({ userId: result.userId });
      } else {
        loginStatus.textContent = result.message;
        loginStatus.style.color = "red";
      }
    } catch (err) {
      loginStatus.textContent = "Error logging in. Please try again.";
      loginStatus.style.color = "red";
    }
  });
});
