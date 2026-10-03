(()=>{if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(e=>console.warn('runtime cache unavailable',e));})();
