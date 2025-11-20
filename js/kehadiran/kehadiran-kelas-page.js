(function(){
  document.addEventListener('DOMContentLoaded', init);

  function init(){
    const sess = Auth.session?.();
    if (!sess || sess.role!=='kelas') return;

    const params = new URLSearchParams(location.search);
    const preset = params.get('status'); // dari kartu dashboard
    const filterStatus = document.getElementById('filterStatus');
    if (preset && filterStatus){
      // set setelah DOM siap, sebelum render
      filterStatus.value = preset;
    }

    // ...existing code...
  }
  // ...existing code...
})();