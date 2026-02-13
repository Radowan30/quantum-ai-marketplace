import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <img
              src="/MIMOSlogo.png"
              alt="MIMOS Logo"
              className="h-8 w-auto brightness-200"
            />
            <span className="font-heading font-bold text-white tracking-tight text-lg">
              MIMOS AI Marketplace
            </span>
          </div>
          <div className="flex gap-8 text-sm">
            <Link href="/privacy-policy">
              <a className="hover:text-white transition-colors">
                Privacy Policy
              </a>
            </Link>
            <Link href="/terms-of-service">
              <a className="hover:text-white transition-colors">
                Terms of Service
              </a>
            </Link>
            <Link href="/contact-support">
              <a className="hover:text-white transition-colors">
                Contact Support
              </a>
            </Link>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-8 text-center md:text-left text-xs">
          <p>
            &copy; {new Date().getFullYear()} MIMOS Berhad. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
