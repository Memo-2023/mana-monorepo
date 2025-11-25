#!/bin/bash

# Generate RS256 key pair for JWT signing

echo "Generating RS256 key pair..."

# Generate private key
openssl genrsa -out private.pem 2048

# Generate public key from private key
openssl rsa -in private.pem -pubout -out public.pem

echo ""
echo "Keys generated successfully!"
echo ""
echo "Private key: private.pem"
echo "Public key: public.pem"
echo ""
echo "Add these to your .env file:"
echo ""
echo "JWT_PRIVATE_KEY=\"$(awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' private.pem)\""
echo ""
echo "JWT_PUBLIC_KEY=\"$(awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' public.pem)\""
echo ""
echo "IMPORTANT: Keep private.pem secure and never commit it to version control!"
