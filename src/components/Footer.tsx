export default function Footer() {
  return (
    <footer>
      <div className="footer-grid">
        <div className="footer-brand">
          <h3>Brand<span>G</span> Nepal</h3>
          <p>A young, dynamic digital marketing agency based in Kathmandu, Nepal. Fuelling growth through creativity, innovation, and client commitment.</p>
          <div className="footer-socials">
            <a href="#" className="footer-soc" aria-label="Facebook">f</a>
            <a href="#" className="footer-soc" aria-label="Instagram">ig</a>
            <a href="#" className="footer-soc" aria-label="LinkedIn">in</a>
            <a href="#" className="footer-soc" aria-label="Twitter">𝕏</a>
          </div>
        </div>
        <div className="footer-col">
          <h4>Services</h4>
          <ul>
            <li><a href="#services">Brand Identity</a></li>
            <li><a href="#services">Strategic Marketing</a></li>
            <li><a href="#services">Social Media</a></li>
            <li><a href="#services">Content Creation</a></li>
            <li><a href="#services">Paid Advertising</a></li>
            <li><a href="#services">Print Media</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Company</h4>
          <ul>
            <li><a href="#about">About Us</a></li>
            <li><a href="#team">Our Team</a></li>
            <li><a href="#clients">Clients</a></li>
            <li><a href="#process">Process</a></li>
            <li><a href="#logo-maker">Free Logo Maker</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Contact</h4>
          <ul>
            <li><a href="tel:9801048019">+977 9801048019</a></li>
            <li><a href="mailto:brandgnepal@gmail.com">brandgnepal@gmail.com</a></li>
            <li><a href="#">Koteshwor, Kathmandu</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 BrandG Nepal. All rights reserved.</span>
      </div>
    </footer>
  );
}
