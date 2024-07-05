const verifiedHTML = (req) => {
    return  `

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification Success</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f7f7f7;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 50px auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        h1 {
            text-align: center;
            color: #333;
        }
        p {
            color: #666;
            line-height: 1.6;
            text-align: center;
        }
        .success-icon {
            text-align: center;
            margin-bottom: 20px;
        }
        .success-icon img {
            width: 130px;
            height: auto;
        }
        .btn {
            display: inline-block;
            background-color: #007bff;
            color: #fff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            transition: background-color 0.3s ease;
        }
        .btn:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">
            <img src="https://img.freepik.com/premium-vector/opened-envelope-document-with-green-check-mark-line-icon-official-confirmation-message-mail-sent-successfully-email-delivery-verification-email-flat-design-vector_662353-720.jpg" alt="Success Icon">
        </div>
        <h1>Email Verification Successful!</h1>
        <p>Your email has been successfully verified. You can now proceed to login.</p>
        <p>Thank you for Rapid Stock Control!.</p>
        <div style="text-align: center;">
            <a href="http://localhost:3000/login-signup" class="btn">Proceed to Login</a>
        </div>
    </div>
    <script>
    setTimeout(() => { 
        window.location.href ="http://localhost:3000/login-signup";
    }, 5000)

    </script>
</body>
</html>


`

}

module.exports = verifiedHTML