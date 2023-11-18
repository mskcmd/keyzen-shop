document.getElementById('registration-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const name = document.getElementById('name').value;
    const number = document.getElementById('mobile').value;
    const con_password = document.getElementById('password-2').value;
    const message = document.getElementById('error-message');

    $.ajax({
        url: "/register",
        data: {
            email: email,
            name: name,
            number: number,
            con_password: con_password,
            password: password
        },
        method: "post",
        success: (response) => {
            if (response.require) {
                message.style.display = "block";
                message.textContent = "Must fill out all the fields.";
            } else if (response.emailPatt) {
                message.style.display = "block";
                message.textContent = "Enter a valid email address.";
            } else if (response.mobile) {
                message.style.display = "block";
                message.textContent = "Enter a valid mobile number.";
            } else if (response.password) {
                message.style.display = "block";
                message.textContent = "Uh-oh! Password must contain 4 digits.";
            } else if (response.emailalready) {
                message.style.display = "block";
                message.textContent = "Uh-oh! You already have an account. Please Log In.";
            } else if (response.wrongpass) {
                message.style.display = "block";
                message.textContent = "Uh-oh! Confirm the correct password.";
            } else if (response.notsaved) {
                message.style.display = "block";
                message.textContent = "Uh-oh! Got some issues. Please try again.";
            } else if (response.name) {
                message.style.display = "block";
                message.textContent = "Uh-oh! Full name should contain at least 3 letters.";
            } else {
                window.location.href = "/otpPage";
            }
        },
    });
});
