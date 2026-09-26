// Explicit unit IDs only: the URL carries no guest information.
const choices={"studio2":"Studio za 2 osobe","studio21":"Studio apartman 2+1","apartment32":"Apartman 3+2","studio32":"Studio apartman 3+2","apartment42":"Apartman 4+2","room2":"Soba za 2 osobe"};
const unitId=new URLSearchParams(location.search).get('unit');
const selector=document.querySelector('#unit-select');
if(selector&&Object.hasOwn(choices,unitId)){selector.value=choices[unitId];selector.dispatchEvent(new Event('change'));const guests=document.querySelector('[name="guests"]');if(guests)guests.max=String({"studio2":2,"studio21":3,"apartment32":5,"studio32":5,"apartment42":6,"room2":2}[unitId]);}
