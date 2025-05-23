# GlidePay - Modern Financial Services Platform

GlidePay is a comprehensive financial services platform designed for Uganda, offering a wide range of services including money transfers, bill payments, online shopping, investments, and savings products.

## Features

### Core Services
- **Money Transfer**: Send and receive money instantly
- **Bill Payments**: Pay utilities and other bills
- **Online Shopping**: Browse and purchase products securely
- **Investments**: Access various investment opportunities
- **Savings**: Manage savings and earn rewards
- **Airtime**: Purchase mobile airtime and data

### Key Features
- Modern, responsive UI with dark theme
- Secure wallet integration
- Real-time transaction tracking
- Multi-currency support
- Investment portfolio management
- User profile customization

## Technology Stack

- Frontend:
  - HTML5
  - CSS3 (with custom variables)
  - JavaScript (ES6+)
  - Bootstrap 5.3
  - Font Awesome 6.4

- Integrations:
  - Web3Modal
  - WalletConnect
  - Ethers.js
  - CELO Blockchain

## Project Structure

```
public/
├── main.html           # Main dashboard
├── profile.html        # User profile page
├── transactions.html   # Transaction history
├── services/
│   ├── invest.html    # Investment hub
│   ├── shopping.html  # Online shopping
│   ├── bills.html     # Bill payments
│   ├── housing.html   # Property listings
│   ├── finances.html  # Loans and savings
│   └── airtime.html   # Airtime purchase
├── faq.html           # FAQ page
└── feedback.html      # User feedback form
```

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/your-username/glide-pay.git
cd glide-pay
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open `http://localhost:3000` in your browser

## Configuration

1. Create a `.env` file in the root directory:
```env
CELO_NETWORK=testnet
API_KEY=your_api_key
```

2. Update the configuration in `config.js`:
```javascript
export const config = {
  apiUrl: 'https://api.glidepay.com',
  networkId: 44787, // Celo Testnet
};
```

## Development

### Code Style
- Use consistent indentation (2 spaces)
- Follow BEM methodology for CSS classes
- Use semantic HTML elements
- Implement responsive design patterns

### Best Practices
- Keep components modular and reusable
- Optimize images and assets
- Implement proper error handling
- Follow security best practices
- Add appropriate documentation

## Security Features

- Secure wallet integration
- PIN protection
- Transaction verification
- Data encryption
- Regular security audits

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- Website: [glidepay.com](https://glidepay.com)
- Email: support@glidepay.com
- Twitter: [@GlidePay](https://twitter.com/GlidePay)

## Acknowledgments

- [CELO Foundation](https://celo.org)
- [Bootstrap](https://getbootstrap.com)
- [Font Awesome](https://fontawesome.com)
- All contributors and supporters 