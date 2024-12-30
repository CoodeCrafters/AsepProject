async function loadFooterAndSetupScroll() {
    try {
      // Load the footer content dynamically
      const footerResponse = await fetch('footer.html');
      if (!footerResponse.ok) throw new Error('Failed to load footer');
      const footerHTML = await footerResponse.text();
  
      // Create a temporary container to parse and extract sections
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = footerHTML;
  
      // Extract the about and contact sections
      const aboutSection = tempDiv.querySelector('.about-section');
      const contactSection = tempDiv.querySelector('.contact-section');
  
      // Append these sections to your main document (if not already present)
      if (aboutSection && !document.body.contains(aboutSection)) {
        document.body.appendChild(aboutSection);
      }
      if (contactSection && !document.body.contains(contactSection)) {
        document.body.appendChild(contactSection);
      }
    } catch (error) {
      console.error('Error loading footer sections:', error);
    }
  }
  
  // Call this function to ensure the sections are added before scrolling
  loadFooterAndSetupScroll();
  
  function scrollToSection(sectionId, color) {
    const section = document.getElementById(sectionId);
  
    if (!section) {
      console.warn(`Section with ID '${sectionId}' not found.`);
      return;
    }
  
    // Remove highlighting from all sections
    document.querySelectorAll('.about-section, .contact-section').forEach((sec) => {
      sec.style.border = '2px solid transparent'; // Reset border
      sec.classList.remove('highlighted'); // Remove animation class
    });
  
    // Scroll to the section smoothly
    section.scrollIntoView({ behavior: 'smooth' });
  
    // Apply the highlight effect
    section.classList.add('highlighted');
    section.style.border = `2px solid ${color}`; // Apply border color
  
    // Remove highlight effect after 5 seconds
    setTimeout(() => {
      section.classList.remove('highlighted');
    }, 5000);
  
    // Remove border after 20 seconds
    setTimeout(() => {
      section.style.border = '2px solid transparent';
    }, 20000);
  }
  

function logout() {
      // Clear token from localStorage
      localStorage.removeItem('userToken');
      localStorage.removeItem('selectedDomain');
  
      // Clear all content
      document.body.innerHTML = '';
  
      // Display logout message
      const logoutMessage = `
        <div style="text-align: center; margin-top: 100px;">
          <h1>😊</h1>
          <h2>Dear User,</h2>
          <p>You are successfully signed out!!</p>
          <p>Thank you for choosing and using us!!</p>
          <p>We hope you visit us again!!</p>
          <p>Best Regards,</p>
          <p>Central Library</p><br><br>
          <p><a href="./login.html" style="color: #007bff; text-decoration: none;">Click here to login again</a></p>
        </div>
      `;
      document.body.innerHTML = logoutMessage; // Display the logout message
  
      // Redirect after a few seconds
      setTimeout(() => {
        window.location.href = './login.html';
      }, 30000); // Redirect after 30 seconds
    }
  
    // Inactivity logout function
    let inactivityTimeout;
    function resetInactivityTimer() {
      clearTimeout(inactivityTimeout); // Clear any existing timeout
      inactivityTimeout = setTimeout(() => {
        logout(); // Call logout function after 3 minutes of inactivity
      }, 3 * 60 * 1000); // 3 minutes = 3 * 60 * 1000 milliseconds
    }
  
    // Attach the inactivity reset function to user activity events
    ['mousemove', 'keypress', 'click'].forEach(event => {
      document.addEventListener(event, resetInactivityTimer);
    });
  
    // Reset the inactivity timer when the user interacts
    resetInactivityTimer(); // Initial timer reset
  