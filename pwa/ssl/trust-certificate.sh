#!/bin/bash

# Safari SSL Certificate Trust Fix
# This script helps Safari trust the local development certificate

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

CERT_PATH="./certs/localhost.crt"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Safari SSL Certificate Trust${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ ! -f "$CERT_PATH" ]; then
    echo -e "${RED}❌ Certificate not found: $CERT_PATH${NC}"
    echo -e "${YELLOW}Run ./generate-ssl.sh first${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Certificate found${NC}"
echo ""

echo -e "${YELLOW}Choose trust method:${NC}"
echo ""
echo -e "  ${GREEN}1)${NC} Add to System Keychain (requires sudo)"
echo -e "     - Works for Safari"
echo -e "     - Permanent solution"
echo -e "     - Requires password"
echo ""
echo -e "  ${GREEN}2)${NC} Add to Login Keychain (no sudo)"
echo -e "     - Works for most apps"
echo -e "     - User-specific"
echo -e "     - No password needed"
echo ""
echo -e "  ${GREEN}3)${NC} Manual Instructions"
echo -e "     - Do it yourself"
echo ""

read -p "Enter choice [1-3]: " choice

case $choice in
  1)
    echo ""
    echo -e "${BLUE}Adding to System Keychain...${NC}"
    echo -e "${YELLOW}You'll be asked for your password${NC}"
    echo ""
    
    sudo security add-trusted-cert \
      -d \
      -r trustRoot \
      -k /Library/Keychains/System.keychain \
      "$CERT_PATH"
    
    if [ $? -eq 0 ]; then
      echo ""
      echo -e "${GREEN}✅ Certificate added to System Keychain${NC}"
      
      # Set trust settings
      echo ""
      echo -e "${BLUE}Setting trust preferences...${NC}"
      
      # Get certificate hash
      CERT_HASH=$(openssl x509 -noout -fingerprint -sha1 -in "$CERT_PATH" | cut -d= -f2 | tr -d :)
      
      echo -e "${GREEN}✅ Done!${NC}"
    else
      echo -e "${RED}❌ Failed to add certificate${NC}"
      exit 1
    fi
    ;;
    
  2)
    echo ""
    echo -e "${BLUE}Adding to Login Keychain...${NC}"
    
    security add-trusted-cert \
      -d \
      -r trustRoot \
      -k ~/Library/Keychains/login.keychain-db \
      "$CERT_PATH"
    
    if [ $? -eq 0 ]; then
      echo ""
      echo -e "${GREEN}✅ Certificate added to Login Keychain${NC}"
    else
      echo -e "${RED}❌ Failed to add certificate${NC}"
      exit 1
    fi
    ;;
    
  3)
    echo ""
    echo -e "${YELLOW}Manual Instructions:${NC}"
    echo ""
    echo -e "${GREEN}1. Double-click on the certificate:${NC}"
    echo -e "   open $CERT_PATH"
    echo ""
    echo -e "${GREEN}2. In Keychain Access:${NC}"
    echo -e "   - Find 'localhost' certificate"
    echo -e "   - Double-click it"
    echo -e "   - Expand 'Trust' section"
    echo -e "   - Set 'Secure Sockets Layer (SSL)' to 'Always Trust'"
    echo -e "   - Close window (enter password)"
    echo ""
    echo -e "${GREEN}3. Restart Safari${NC}"
    echo ""
    
    read -p "Press Enter to open certificate... "
    open "$CERT_PATH"
    exit 0
    ;;
    
  *)
    echo -e "${RED}Invalid choice${NC}"
    exit 1
    ;;
esac

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo -e "${GREEN}1. Restart Safari completely:${NC}"
echo -e "   osascript -e 'quit app \"Safari\"'"
echo -e "   open -a Safari"
echo ""
echo -e "${GREEN}2. Clear Safari cache:${NC}"
echo -e "   Safari → Develop → Empty Caches (⌘+Option+E)"
echo ""
echo -e "${GREEN}3. Visit:${NC}"
echo -e "   https://localhost:8443/Application/static/index.html"
echo ""
echo -e "${GREEN}4. You should see 🔒 lock icon (no warnings)${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Ask to restart Safari
read -p "Restart Safari now? (y/n) " restart

if [[ $restart =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${BLUE}Restarting Safari...${NC}"
    osascript -e 'quit app "Safari"' 2>/dev/null || true
    sleep 2
    open -a Safari "https://localhost:8443/Application/static/index.html"
    echo -e "${GREEN}✅ Safari restarted${NC}"
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
