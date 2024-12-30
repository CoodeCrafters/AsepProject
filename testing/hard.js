document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('userToken');
  
    if (!token) {
      alert('Unauthorized access. Please log in.');
      window.location.href = './login.html';
      return;
    }