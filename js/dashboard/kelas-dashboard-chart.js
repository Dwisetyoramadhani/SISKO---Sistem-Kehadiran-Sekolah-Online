(function(){
  document.addEventListener('DOMContentLoaded', () => {
    const s = Auth.session();
    if (!s || s.role!=='kelas') return;
    if (typeof ApexCharts==='undefined') return;
    build(s.kelas, s.jurusan);
  });

  function lastDays(n){
    const arr=[]; for(let i=n-1;i>=0;i--) arr.push(new Date(Date.now()-i*86400000).toISOString().slice(0,10));
    return arr;
  }

  function build(kelas,jurusan){
    const el = document.getElementById('attendance-chart');
    if (!el) return;
    const label = `${kelas} ${jurusan||''}`.trim();
    const raw = (window.KehadiranStore?.getAll()||[]).filter(r => r.kelas === label);
    const days = lastDays(7);
    const statuses = ['Hadir','Izin','Sakit','Alfa'];
    const series = statuses.map(st => ({
      name: st,
      data: days.map(d => raw.filter(r => r.tanggal===d && r.status===st).length)
    }));
    const total = series.reduce((s,a)=>s+a.data.reduce((x,y)=>x+y,0),0);
    if (!total){
      el.style.display='none';
      const empty = document.getElementById('chart-empty');
      if (empty) empty.style.display='block';
      return;
    }
    new ApexCharts(el, {
      chart:{ type:'area', height:300, toolbar:{show:false}, fontFamily:'inherit' },
      colors:['#4a60f0','#6b7077','#f5b100','#e06363'],
      stroke:{ curve:'smooth', width:2 },
      dataLabels:{ enabled:false },
      legend:{ position:'top', horizontalAlign:'left', fontSize:'11px' },
      grid:{ borderColor:'#e2e4e8', strokeDashArray:4 },
      xaxis:{ categories: days.map(d=>d.slice(5)) },
      yaxis:{ min:0 },
      fill:{ type:'gradient', gradient:{ opacityFrom:.35, opacityTo:.05, stops:[0,90,100] } },
      series
    }).render();
  }
})();