import { Github, Linkedin, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative mt-8 border-t border-gray-700/30 bg-gradient-to-r from-slate-900/50 via-gray-900/50 to-slate-800/50 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5"></div>
      
      <div className="relative container mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Left side - Branding */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Ephemeral Echoes
              </h3>
              <p className="text-sm text-gray-400">
                Where thoughts drift through the digital ether
              </p>
            </div>
          </div>

          {/* Center - Copyright */}
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              © 2025 Created with{' '}
              <Heart className="w-4 h-4 inline text-pink-400 mx-1" />
              by{' '}
              <span className="font-medium text-purple-400">Sumayyah</span>
            </p>
          </div>

          {/* Right side - Social Links */}
          <div className="flex items-center space-x-3">
            <a
              href="https://github.com/sumusa"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50 text-gray-300 hover:bg-gray-700/50 hover:border-gray-600/50 hover:text-white transition-all duration-200"
            >
              <Github className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              <span className="text-sm font-medium">GitHub</span>
            </a>
            
            <a
              href="https://linkedin.com/in/sumayyahmusa"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30 hover:border-blue-500/50 hover:text-blue-200 transition-all duration-200"
            >
              <Linkedin className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              <span className="text-sm font-medium">LinkedIn</span>
            </a>
          </div>
        </div>

        {/* Bottom divider with gradient */}
        <div className="mt-4 pt-4 border-t border-gray-700/30">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Built with React, TypeScript, Supabase, ShadCN, and lots of ☕
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
} 