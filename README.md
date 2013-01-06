# s3pass

Tiny personal password manager hosted on Amazon S3. Inspired by https://github.com/joelhewitt/awspass

Copyright (C) 2013  Max Garmash <max@garmash.org> @linx56

## Features
1. Cheap & reliable password management solution.
1. Your data is totally controlled by you.
1. AES-encryption.
1. Simple intuitive interface.

## Usage

+ You need an Amazon WS account. So, get one it is cheap.
+ Create bucket with some name (here and below, replace `s3pass.myhost.org` with your bucket name).
+ Enable static web hosting for bucket and set index document to `index.html` and remember endpoint url (something like `s3pass.myhost.org.s3-website-eu-west-1.amazonaws.com`).
+Set bucket policy. 

```javascript    
{
    "Version": "2008-10-17",
    "Statement": [
        {
            "Sid": "AddPerm",
            "Effect": "Allow",
            "Principal": {
                "AWS": "*"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::s3pass.myhost.org/*"
        }
    ]
}
```
+ Set bucket Cors configuration.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
    <CORSRule>
        <AllowedOrigin>*</AllowedOrigin>
        <AllowedMethod>PUT</AllowedMethod>
        <AllowedMethod>GET</AllowedMethod>
        <MaxAgeSeconds>3000</MaxAgeSeconds>
        <AllowedHeader>*</AllowedHeader>
    </CORSRule>
</CORSConfiguration>
```

+ Optionally create new user with IAM console or use your main Access Key & Access Secret.
+ If you decided to create new user - add him a policy like this: 

```javascript
{
  "Statement": [
    {
      "Action": "s3:*",
      "Effect": "Allow",
      "Resource": [
        "arn:aws:s3:::s3pass.myhost.org",
        "arn:aws:s3:::s3pass.myhost.org/*"
      ]
    }
  ],
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:ListAllMyBuckets",
      "Resource": "arn:aws:s3:::*"
    }
  ]
}
```
+ Upoad `js`, `static` and `index.html` to your bucket.
+ Go to endpoint from step 2 (s3pass.myhost.org.s3-website-eu-west-1.amazonaws.com).
+ First time you need to fill
    1. masterpassword (twice)
    1. your bucket name
    1. Access Key
    1. Access Secret
+ s3pass will write bucket name direct into `index.html`, create file `storage` with encrypted (with AES) s3 access data and reload page.
+ After that you can access your data only if masterpassword provided at login screen can decrypt storage file.
+ Interface is quite intuitive and cosists of two screens
    1. storage - here you can search for keys (hostnames or whatever...) with autocomplete (hint: for full list press backspace once) and add/delete your secrets
    1. settings - here you can configure initial parameters
+ Optionally you can point your dns (CNAME) for `s3pass.youhost.org` to s3 endpoint  and access your s3pass via short link.
