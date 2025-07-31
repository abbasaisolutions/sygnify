import React from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, Mail, Phone, MapPin, Github, Twitter, Linkedin
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { name: 'GitHub', icon: Github, href: 'https://github.com/sygnify' },
    { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/sygnify' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com/company/sygnify' }
  ];

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* Brand Section */}
          <div>
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Sygnify</span>
            </div>
            <p className="text-gray-600 mb-4">
              A Product of AbbasAI Solutions
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Mail className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-sm text-gray-600">contact@sygnify.com</span>
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-sm text-gray-600">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-sm text-gray-600">San Francisco, CA</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Links</h3>
            <div className="space-y-2">
              <a href="#docs" className="block text-sm text-gray-600 hover:text-gray-900">Documentation</a>
              <a href="#support" className="block text-sm text-gray-600 hover:text-gray-900">Support</a>
              <a href="#privacy" className="block text-sm text-gray-600 hover:text-gray-900">Privacy Policy</a>
              <a href="#terms" className="block text-sm text-gray-600 hover:text-gray-900">Terms of Service</a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600 mb-2 md:mb-0">
              © {currentYear} Sygnify. All rights reserved.
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-500">SOC 2 Compliant</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-gray-500">GDPR Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 