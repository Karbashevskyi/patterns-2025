#!/bin/bash

# SSL Certificate Generator for PWA Development
# Generates self-signed SSL certificates for local HTTPS server
# Required for Safari PWA features (notifications, service workers, etc.)

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CERT_DIR="./certs"
DOMAIN="localhost"
DAYS_VALID=365

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  SSL Certificate Generator for PWA${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if OpenSSL is installed
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}❌ Error: OpenSSL is not installed${NC}"
    echo -e "${YELLOW}Install it with:${NC}"
    echo -e "  macOS:   brew install openssl"
    echo -e "  Ubuntu:  sudo apt-get install openssl"
    echo -e "  Windows: Download from https://slproweb.com/products/Win32OpenSSL.html"
    exit 1
fi

echo -e "${GREEN}✅ OpenSSL found: $(openssl version)${NC}"
echo ""

# Create certs directory
if [ -d "$CERT_DIR" ]; then
    echo -e "${YELLOW}⚠️  Certificates directory already exists${NC}"
    read -p "Do you want to overwrite existing certificates? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}ℹ️  Keeping existing certificates${NC}"
        exit 0
    fi
    rm -rf "$CERT_DIR"
fi

mkdir -p "$CERT_DIR"
echo -e "${GREEN}✅ Created directory: $CERT_DIR${NC}"
echo ""

# Generate private key
echo -e "${BLUE}🔐 Generating private key...${NC}"
openssl genrsa -out "$CERT_DIR/localhost.key" 2048 2>/dev/null
echo -e "${GREEN}✅ Private key created: $CERT_DIR/localhost.key${NC}"
echo ""

# Create OpenSSL configuration file
echo -e "${BLUE}📝 Creating OpenSSL configuration...${NC}"
cat > "$CERT_DIR/localhost.conf" <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_req

[dn]
C = US
ST = Development
L = Local
O = PWA Development
OU = Development
CN = localhost

[v3_req]
subjectAltName = @alt_names
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
DNS.3 = 127.0.0.1
IP.1 = 127.0.0.1
IP.2 = ::1
EOF
echo -e "${GREEN}✅ Configuration created: $CERT_DIR/localhost.conf${NC}"
echo ""

# Generate self-signed certificate
echo -e "${BLUE}📜 Generating SSL certificate...${NC}"
openssl req -new -x509 \
    -key "$CERT_DIR/localhost.key" \
    -out "$CERT_DIR/localhost.crt" \
    -days $DAYS_VALID \
    -config "$CERT_DIR/localhost.conf" \
    2>/dev/null

echo -e "${GREEN}✅ Certificate created: $CERT_DIR/localhost.crt${NC}"
echo -e "${GREEN}✅ Valid for: $DAYS_VALID days${NC}"
echo ""

# Display certificate info
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Certificate Information${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
openssl x509 -in "$CERT_DIR/localhost.crt" -noout -subject -dates -ext subjectAltName
echo ""

# Create a combined PEM file (some servers need this)
cat "$CERT_DIR/localhost.key" "$CERT_DIR/localhost.crt" > "$CERT_DIR/localhost.pem"
echo -e "${GREEN}✅ Combined PEM created: $CERT_DIR/localhost.pem${NC}"
echo ""

# Set proper permissions
chmod 600 "$CERT_DIR/localhost.key"
chmod 644 "$CERT_DIR/localhost.crt"
chmod 644 "$CERT_DIR/localhost.pem"
echo -e "${GREEN}✅ Permissions set correctly${NC}"
echo ""

# Instructions
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  📋 Next Steps${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}1. Trust the certificate in your system:${NC}"
echo ""
echo -e "${GREEN}   macOS:${NC}"
echo -e "   sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain $CERT_DIR/localhost.crt"
echo ""
echo -e "${GREEN}   Linux (Ubuntu/Debian):${NC}"
echo -e "   sudo cp $CERT_DIR/localhost.crt /usr/local/share/ca-certificates/"
echo -e "   sudo update-ca-certificates"
echo ""
echo -e "${GREEN}   Windows:${NC}"
echo -e "   - Double-click $CERT_DIR/localhost.crt"
echo -e "   - Click 'Install Certificate'"
echo -e "   - Choose 'Local Machine' → 'Trusted Root Certification Authorities'"
echo ""
echo -e "${YELLOW}2. Update server.js to use HTTPS:${NC}"
echo -e "   The files are ready in ./certs/"
echo -e "   - Private key: $CERT_DIR/localhost.key"
echo -e "   - Certificate: $CERT_DIR/localhost.crt"
echo ""
echo -e "${YELLOW}3. Access your app at:${NC}"
echo -e "   ${GREEN}https://localhost:8000${NC}"
echo ""
echo -e "${YELLOW}4. For Safari iOS:${NC}"
echo -e "   - Trust certificate on Mac first"
echo -e "   - Connect iPhone via USB"
echo -e "   - Enable 'Web Inspector' on iPhone (Settings → Safari → Advanced)"
echo -e "   - Open Safari on Mac → Develop → [Your iPhone] → localhost"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ SSL certificates generated successfully!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}⚠️  Note: These are self-signed certificates for development only.${NC}"
echo -e "${YELLOW}   Do NOT use in production!${NC}"
echo ""
