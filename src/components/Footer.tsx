import { Heart } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 md:mb-0">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500 fill-current" />
            <span>for Malaysia</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span>polarsou v1.0.0</span>
            <span>•</span>
            <span>© 2025</span>
            <span>•</span>
            <a 
              href="https://github.com/TerenceTan/polarsou" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-gray-700 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Supporting Malaysian businesses with smart bill splitting • SST & Service Charge included
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

