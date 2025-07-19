(function() {
  // Check if window.opener exists and postMessage is callable
  if (window.opener && typeof window.opener.postMessage === 'function') {
    if (window.__user) {
      window.opener.postMessage({
        type: 'google-login-success',
        user: window.__user
      }, window.location.origin);
    } else {
      window.opener.postMessage({
        type: 'google-login-error',
        error: 'No user data!'
      }, window.location.origin);
    }
  }
  window.close();
})();