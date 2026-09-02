// Utility to get or translate Tamil names for products

const EXACT_TAMIL_MAP = {
  // ── One Sound Crackers ──────────────────────────────────
  '2 sound bomb': '2 சவுண்ட் பாம்',
  '2.75" kuruvi': '2.75" குருவி வெடி',
  '2.75 kuruvi': '2.75" குருவி வெடி',
  '3.5" laxmi': '3.5" லட்சுமி வெடி',
  '3.5" lakshmi': '3.5" லட்சுமி வெடி',
  '4" deluxe laxmi': '4" டீலக்ஸ் லட்சுமி',
  '4" deluxe lakshmi': '4" டீலக்ஸ் லட்சுமி',
  '4" gold laxmi': '4" கோல்டு லட்சுமி',
  '4" gold lakshmi': '4" கோல்டு லட்சுமி',
  '4"laxmi': '4" லட்சுமி',
  '4" laxmi': '4" லட்சுமி',
  '4"lakshmi': '4" லட்சுமி',
  '4"super deluxe laxmi': '4" சூப்பர் டீலக்ஸ் லட்சுமி',
  '4" super deluxe laxmi': '4" சூப்பர் டீலக்ஸ் லட்சுமி',
  '5" laxmi': '5" லட்சுமி வெடி',
  '6" laxmi': '6" லட்சுமி வெடி',
  'lion gun': 'லயன் துப்பாக்கி',

  // ── Ground Chakkar ──────────────────────────────────────
  'colour spinner combo': 'கலர் ஸ்பின்னர் காம்போ',
  'color spinner combo': 'கலர் ஸ்பின்னர் காம்போ',
  'drizzling wheel': 'டிரிஸ்லிங் வீல்',
  'ground chakkar big': 'தரை சக்கரம் பெரியது',
  'ground chakkar deluxe': 'தரை சக்கரம் டீலக்ஸ்',
  'ground chakkar special': 'தரை சக்கரம் ஸ்பெஷல்',
  'lotus wheel': 'தாமரை சக்கரம்',
  'masks chaska': 'மாஸ்கா சஸ்கா',
  'spin master mini': 'ஸ்பின் மாஸ்டர் மினி',
  'spinner super deluxe': 'ஸ்பின்னர் சூப்பர் டீலக்ஸ்',
  'whizling wheel (5pcs)': 'விசில் சக்கரம்',
  'whizling wheel': 'விசில் சக்கரம்',
  'wire chakkar': 'கம்பி சக்கரம்',

  // ── Flower Pots ─────────────────────────────────────────
  'colour cone (vanitha)': 'கலர் கோன் (வனிதா)',
  'color cone (vanitha)': 'கலர் கோன் (வனிதா)',
  'colour cone vanitha': 'கலர் கோன் (வனிதா)',
  'color cone vanitha': 'கலர் கோன் (வனிதா)',
  'colour cone': 'கலர் கோன் (வனிதா)',
  'color cone': 'கலர் கோன் (வனிதா)',
  'colour koti': 'கலர் கோட்டி',
  'color koti': 'கலர் கோட்டி',
  'colour koti deluxe': 'கலர் கோட்டி டீலக்ஸ்',
  'color koti deluxe': 'கலர் கோட்டி டீலக்ஸ்',
  'flower pot super deluxe (10pcs)': 'சூப்பர் டீலக்ஸ் பூச்சட்டி',
  'flower pot super deluxe': 'சூப்பர் டீலக்ஸ் பூச்சட்டி',
  'flower pots asoka': 'அசோகா பூச்சட்டி',
  'flower pots big': 'பெரிய பூச்சட்டி',
  'flower pots special': 'ஸ்பெஷல் பூச்சட்டி',
  'gypsy (5 pcs)': 'ஜிப்சி',
  'gypsy': 'ஜிப்சி',
  'jumbo pots': 'ஜம்போ பூச்சட்டி',
  'pink colour koti (5 pcs)': 'பிங்க் கலர் கோட்டி (5 எண்ணம்)',
  'pink colour koti': 'பிங்க் கலர் கோட்டி',
  'pot girl': 'பாட் கேர்ள்',
  'tricolour fountain': 'மூவர்ண ஃபவுண்டன்',
  'tricolor fountain': 'மூவர்ண ஃபவுண்டன்',
  'varnajal (vanitha)': 'வர்ணஜல் (வனிதா)',
  'varnajal': 'வர்ணஜல் (வனிதா)',

  // ── Twinkling Star ──────────────────────────────────────
  '1.5ft twinkling star': '1.5 அடி சரவெடி',
  '1.5 ft twinkling star': '1.5 அடி சரவெடி',
  '4ft twinkling star': '4 அடி சரவெடி',
  '4 ft twinkling star': '4 அடி சரவெடி',

  // ── Rockets ─────────────────────────────────────────────
  '2 sound rocket': '2 சவுண்ட் ராக்கெட்',
  '3 sound rocket': '3 சவுண்ட் ராக்கெட்',
  'baby rocket': 'பேபி ராக்கெட்',
  'colour rocket': 'கலர் ராக்கெட்',
  'color rocket': 'கலர் ராக்கெட்',
  'lunik rocket': 'லூனிக் ராக்கெட்',
  'rocket bomb': 'ராக்கெட் பாம்',
  'whiziling rocket (5 pcs)': 'விசிலிங் ராக்கெட்',
  'whizling rocket (5 pcs)': 'விசிலிங் ராக்கெட்',
  'whizling rocket': 'விசிலிங் ராக்கெட்',

  // ── Bombs ───────────────────────────────────────────────
  '100 bijili crackers': '100 பிஜிலி வெடி',
  'adavdi': 'அடவடி',
  'atom bomb': 'ஆட்டம் பாம்',
  'bullet bomb': 'புல்லட் பாம்',
  'classic bomb': 'கிளாசிக் பாம்',
  'digital bomb': 'டிஜிட்டல் பாம்',
  'durandhar bomb': 'துரந்தர் பாம்',
  'hacker bomb': 'ஹேக்கர் பாம்',
  'hydro bomb': 'ஹைட்ரோ பாம்',
  'king bomb': 'கிங் பாம்',
  'mighty bomb': 'மைட்டி பாம்',

  // ── Repeating Shots ─────────────────────────────────────
  '10*10 ipl': '10*10 ஐபிஎல்',
  '100 shot whistling': '100 ஷாட் விசிலிங்',
  '12 shot': '12 ஷாட்',
  '12 shot whistling': '12 ஷாட் விசிலிங்',
  '120 shot': '120 ஷாட்',
  '120 shot premium': '120 ஷாட் ப்ரீமியம்',
  '15 shot': '15 ஷாட்',
  '15 shot colour smoke': '15 ஷாட் கலர் ஸ்மோக்',
  '2" shell setout (30 shot)': '2" ஷெல் செட்அவுட் (30 ஷாட்)',
  '2" shell setout': '2" ஷெல் செட்அவுட் (30 ஷாட்)',
  '240 shot': '240 ஷாட்',
  '240 shot premium': '240 ஷாட் ப்ரீமியம்',
  '25 shot whistling': '25 ஷாட் விசிலிங்',
  '3.5" shell setout (24 shots)': '3.5" ஷெல் செட்அவுட் (24 ஷாட்ஸ்)',
  '3.5" shell setout': '3.5" ஷெல் செட்அவுட் (24 ஷாட்ஸ்)',
  '3*12 mines function inf': '3*12 மைன்ஸ் பங்க்ஷன்',
  '30 shot': '30 ஷாட்',
  '30 shot crack jack': '30 ஷாட் கிராக் ஜாக்',
  '30 shot flash joker': '30 ஷாட் பிளாஷ் ஜோக்கர்',
  '30 shot peacock dance': '30 ஷாட் பீகாக் டான்ஸ்',
  '30 shot premium': '30 ஷாட் ப்ரீமியம்',
  '5*10': '5*10',
  '50 shot whistling': '50 ஷாட் விசிலிங்',
  '60 shot': '60 ஷாட்',
  '60 shot premium': '60 ஷாட் ப்ரீமியம்',
  'double delight (10 shot)': 'டபுள் டிலைட் (10 ஷாட்)',
  'double delight': 'டபுள் டிலைட் (10 ஷாட்)',
  'inf 12 shot': 'INF 12 ஷாட்',

  // ── Comets / Sky Shots ──────────────────────────────────
  '1.75" shell (3pcs)': '1.75" ஷெல் (3 எண்ணம்)',
  '1.75" shell': '1.75" ஷெல் (3 எண்ணம்)',
  '12 step': '12 ஸ்டெப்',
  '2" shell': '2" ஷெல்',
  '2" shell premium': '2" ஷெல் ப்ரீமியம்',
  '3 step': '3 ஸ்டெப்',
  '3.5" shell': '3.5" ஷெல்',
  '3.5" pipe spl colours': '3.5" பைப் ஸ்பெஷல் கலர்ஸ்',
  '3.5" shell niagara falls (2 pcs)': '3.5" ஷெல் நயாகரா ஃபால்ஸ் (2 எண்ணம்)',
  '3.5" shell niagara falls': '3.5" ஷெல் நயாகரா ஃபால்ஸ் (2 எண்ணம்)',
  '4" shell': '4" ஷெல்',
  '4" shell elite': '4" ஷெல் எலைட்',
  '5"shell (2 pcs/box)': '5" ஷெல் (2 எண்ணம்)',
  '5"shell lemon nights (vanitha)': '5" ஷெல் லெமன் நைட்ஸ் (வனிதா)',
  '5"shell orange (vanitha)': '5" ஷெல் ஆரஞ்ச் (வனிதா)',
  '5"shell purple rain (vanitha)': '5" ஷெல் பர்பிள் ரெயின் (வனிதா)',
  '7 step': '7 ஸ்டெப்',
  'bat man sky shot (2pcs)': 'பேட்மேன் ஸ்கை ஷாட் (2 எண்ணம்)',
  'bat man sky shot': 'பேட்மேன் ஸ்கை ஷாட் (2 எண்ணம்)',
  'battle shot sky shot inf (5pcs)': 'பேட்டில் ஷாட் ஸ்கை ஷாட் (5 எண்ணம்)',
  'chotta pipe sky shot': 'சோட்டா பைப் ஸ்கை ஷாட்',
  'double ball': 'டபுள் பால்',
  'dup tip sky shot (3pcs)': 'டப் டிப் ஸ்கை ஷாட் (3 எண்ணம்)',
  'dup tip sky shot': 'டப் டிப் ஸ்கை ஷாட் (3 எண்ணம்)',
  'hot shot sky shot (6pcs)': 'ஹாட் ஷாட் ஸ்கை ஷாட் (6 எண்ணம்)',
  'hot shot sky shot': 'ஹாட் ஷாட் ஸ்கை ஷாட்',
  'mr.bean sky shot (5pcs)': 'மிஸ்டர் பீன் ஸ்கை ஷாட் (5 எண்ணம்)',
  'mr bean sky shot (5pcs)': 'மிஸ்டர் பீன் ஸ்கை ஷாட் (5 எண்ணம்)',
  'nano sky shot (5pcs)': 'நானோ ஸ்கை ஷாட் (5 எண்ணம்)',
  'nano sky shot': 'நானோ ஸ்கை ஷாட் (5 எண்ணம்)',
  'pink out (2pcs) (vanitha)': 'பிங்க் அவுட் (2 எண்ணம்) (வனிதா)',
  'pink out (vanitha)': 'பிங்க் அவுட் (வனிதா)',
  'sony mines sky shot (5pcs)': 'சோனி மைன்ஸ் ஸ்கை ஷாட் (5 எண்ணம்)',
  'sony mines sky shot': 'சோனி மைன்ஸ் ஸ்கை ஷாட் (5 எண்ணம்)',
  'up sky shot (5pcs)': 'அப் ஸ்கை ஷாட் (5 எண்ணம்)',
  'up sky shot': 'அப் ஸ்கை ஷாட் (5 எண்ணம்)',
  'vanitha fly machine (sky shot with green chakkar - 10 pcs)': 'வனிதா ஃப்ளை மெஷின்',
  'vanitha fly machine': 'வனிதா ஃப்ளை மெஷின்',
  'whatsapp mines sky shot (3pcs)': 'வாட்ஸ்அப் மைன்ஸ் ஸ்கை ஷாட் (3 எண்ணம்)',
  'whatsapp mines sky shot': 'வாட்ஸ்அப் மைன்ஸ் ஸ்கை ஷாட் (3 எண்ணம்)',

  // ── Fancy Pencil Varieties ──────────────────────────────
  '3 colour pencil (vanitha)': '3 கலர் பென்சில் (வனிதா)',
  'at night (vanitha)': 'அட் நைட் (வனிதா)',
  'bat': 'பேட்',
  'crocodile': 'முதலை',
  'jelly bean candle': 'ஜெல்லி பீன் கேண்டில்',
  'laser candle (3 pcs)': 'லேசர் கேண்டில் (3 எண்ணம்)',
  'magic light': 'மேஜிக் லைட்',
  'pyro tourch (vanitha)': 'பைரோ டார்ச் (வனிதா)',
  'sea horse': 'சீ ஹார்ஸ்',
  'sea laser': 'சீ லேசர்',
  'selfie stick': 'செல்ஃபி ஸ்டிக்',
  'shark': 'ஷார்க்',
  'star gun/ pistol 5g (2pcs)': 'ஸ்டார் கன் / பிஸ்டல் 5G (2 எண்ணம்)',
  'tiny gun (vanitha)': 'டைனி கன் (வனிதா)',
  'tiny gun vanitha': 'டைனி கன் (வனிதா)',
  'top gun (5pcs)': 'டாப் கன் (5 எண்ணம்)',

  // ── Fountain & Fancy Novelties ──────────────────────────
  '4 in 1 chocolate chakkar': '4 இன் 1 சாக்லேட் சக்கரம்',
  '4" fountain': '4" ஃபவுண்டன்',
  '4*4 wheel': '4*4 வீல்',
  '90 watts': '90 வாட்ஸ்',
  'ahsrafi big': 'அஷ்ரஃபி பெரியது',
  'animal shower': 'அனிமல் ஷவர்',
  'arjun tank': 'அர்ஜுன் டேங்க்',
  'bada peacock': 'படா பீகாக்',
  'bambaram': 'பம்பரம்',
  'barbie fountain': 'பார்பி ஃபவுண்டன்',
  'barbie sky': 'பார்பி ஸ்கை',
  'bubbels': 'பபல்ஸ்',
  'butterfly': 'பட்டாம்பூச்சி',
  'chakkar celebration': 'சக்கரம் செலிப்ரேஷன்',
  'chikoo bunty': 'சிக்கூ பண்டி',
  'cluster 5 in 1sony': 'கிளஸ்டர் 5 இன் 1 சோனி',
  'color smoke 3pcs': 'கலர் ஸ்மோக் (3 எண்ணம்)',
  'colour fountain mini': 'கலர் ஃபவுண்டன் மினி',
  'disco shower': 'டிஸ்கோ ஷவர்',
  'dora singer': 'டோரா சிங்கர்',
  'duck': 'டக்',
  'fountain big (5pcs)': 'ஃபவுண்டன் பெரியது (5 எண்ணம்)',
  'four square inf': 'ஃபோர் ஸ்கொயர்',
  'friends flower': 'ஃபிரண்ட்ஸ் ஃப்ளவர்',
  'ganga jamuna': 'கங்கா ஜமுனா',
  'helicopter': 'ஹெலிகாப்டர்',
  'holi fruits': 'ஹோலி ஃப்ரூட்ஸ்',
  'holi pot': 'ஹோலி பாட்',
  'i spin (vanitha)': 'ஐ ஸ்பின் (வனிதா)',
  'kit kat': 'கிட் கேட்',
  'lion': 'லயன்',
  'lollipop': 'லாலிபாப்',
  'mad angles inf': 'மேட் ஆங்கிள்ஸ்',
  'mega fountain': 'மெகா ஃபவுண்டன்',
  'mini peacock': 'மினி மயில்',
  'mini siren': 'மினி சைரன்',
  'motu patlu fountain': 'மோட்டு பட்லு ஃபவுண்டன்',
  'mumbo jumbo inf': 'மம்பா ஜம்போ',
  'pappu shower': 'பப்பு ஷவர்',
  'paris tower': 'பாரிஸ் டவர்',
  'peacock': 'பீகாக் (மயில்)',
  'pearl drops': 'பேர்ல் ட்ராப்ஸ்',
  'photo flash': 'போட்டோ பிளாஷ்',
  'pink panther (fountain)': 'பிங்க் பாந்தர் (ஃபவுண்டன்)',
  'pom pom': 'பாம் பாம்',
  'rain and shine': 'ரெயின் அண்ட் ஷைன்',
  'scooby doo fountain': 'ஸ்கூபி டூ ஃபவுண்டன்',
  'shin chan': 'ஷின் சான்',
  'siren (3pcs)': 'சைரன் (3 எண்ணம்)',
  'sky lander': 'ஸ்கை லேண்டர்',
  'smoke peacock': 'ஸ்மோக் மயில்',
  'snake beats': 'பாம்பு பீட்ஸ்',
  'snake chakkar': 'பாம்பு சக்கரம்',
  'snake tablet': 'பாம்பு டேப்லெட்',
  'spectra (vanitha)': 'ஸ்பெக்ட்ரா (வனிதா)',
  'spice butterfly sony': 'ஸ்பைஸ் பட்டாம்பூச்சி சோனி',
  'super heros': 'சூப்பர் ஹீரோஸ்',
  'tin fountain': 'டின் ஃபவுண்டன்',
  'titanic flower sony': 'டைட்டானிக் ஃப்ளவர் சோனி',
  'tower pots': 'டவர் பூச்சட்டி',
  'twin lighting ball': 'ட்வின் லைட்டிங் பால்',
  'twister (vanitha)': 'ட்விஸ்டர் (வனிதா)',
  'violet matrix': 'வைலட் மேட்ரிக்ஸ்',
  'water queen': 'வாட்டர் குயின்',
  'wonderla': 'வண்டர்லா',

  // ── Matches ─────────────────────────────────────────────
  'deluxe matches 10\'s': 'டீலக்ஸ் மேட்சஸ் (10 எண்ணம்)',
  'deluxe matches 10s': 'டீலக்ஸ் மேட்சஸ் (10 எண்ணம்)',
  'lamba 5\'s': 'லாம்பா (5 எண்ணம்)',
  'lamba 5s': 'லாம்பா (5 எண்ணம்)',
  'titanic 5\'s': 'டைட்டானிக் (5 எண்ணம்)',
  'titanic 5s': 'டைட்டானிக் (5 எண்ணம்)',

  // ── Guns And Caps ───────────────────────────────────────
  'ring cap': 'ரிங் கேப்',
  'transparent gun': 'டிரான்ஸ்பேரண்ட் கன்',

  // ── Sparklers ───────────────────────────────────────────
  '10cm colour': '10 செ.மீ கலர் ஸ்பார்க்லர்',
  '10cm electric08': '10 செ.மீ எலக்ட்ரிக் ஸ்பார்க்லர்',
  '10cm electric': '10 செ.மீ எலக்ட்ரிக் ஸ்பார்க்லர்',
  '10cm green': '10 செ.மீ கிரீன் ஸ்பார்க்லர்',
  '10cm red': '10 செ.மீ ரெட் ஸ்பார்க்லர்',
  '10cm silver drops': '10 செ.மீ சில்வர் ட்ராப்ஸ்',
  '12cm colour': '12 செ.மீ கலர் ஸ்பார்க்லர்',
  '12cm electric': '12 செ.மீ எலக்ட்ரிக் ஸ்பார்க்லர்',
  '12cm green': '12 செ.மீ கிரீன் ஸ்பார்க்லர்',
  '12cm red': '12 செ.மீ ரெட் ஸ்பார்க்லர்',
  '15cm colour': '15 செ.மீ கலர் ஸ்பார்க்லர்',
  '15cm electric': '15 செ.மீ எலக்ட்ரிக் ஸ்பார்க்லர்',
  '15cm green': '15 செ.மீ கிரீன் ஸ்பார்க்லர்',
  '15cm red': '15 செ.மீ ரெட் ஸ்பார்க்லர்',
  '15cm silver drops': '15 செ.மீ சில்வர் ட்ராப்ஸ்',
  '30cm colour': '30 செ.மீ கலர் ஸ்பார்க்லர்',
  '30cm electric': '30 செ.மீ எலக்ட்ரிக் ஸ்பார்க்லர்',
  '30cm green': '30 செ.மீ கிரீன் ஸ்பார்க்லர்',
  '30cm red': '30 செ.மீ ரெட் ஸ்பார்க்லர்',
  '50cm colour': '50 செ.மீ கலர் ஸ்பார்க்லர்',
  '50cm electric': '50 செ.மீ எலக்ட்ரிக் ஸ்பார்க்லர்',
  '75cm electric': '75 செ.மீ எலக்ட்ரிக் ஸ்பார்க்லர்',
  'rotating sparklers': 'ரோட்டேட்டிங் ஸ்பார்க்லர்',

  // ── Gift Boxes ──────────────────────────────────────────
  'carnatic 40 items': 'கர்நாடக 40 ஐட்டம்ஸ்',
  'classical 50 items': 'கிளாசிக்கல் 50 ஐட்டம்ஸ்',
  'folk 25 items': 'ஃபோக் 25 ஐட்டம்ஸ்',
  'jazz 30 items': 'ஜாஸ் 30 ஐட்டம்ஸ்',
  'kathakali 60 items': 'கதகளி 60 ஐட்டம்ஸ்',
  'rap 20 items': 'ராப் 20 ஐட்டம்ஸ்',
  'western 35 items': 'வெஸ்டர்ன் 35 ஐட்டம்ஸ்',

  // ── Net Rate Products ───────────────────────────────────
  '100 deluxe': '100 டீலக்ஸ்',
  '100 wala': '100 சரம்',
  '10k full count': '10K ஃபுல் கவுண்ட்',
  '10k half count': '10K ஹாஃப் கவுண்ட்',
  '1k full count': '1K ஃபுல் கவுண்ட்',
  '1k short count': '1K ஷார்ட் கவுண்ட்',
  '1kg': '1 கிலோ',
  '200 wala': '200 சரம்',
  '24 deluxe': '24 டீலக்ஸ்',
  '250gm': '250 கிராம்',
  '28 chorsa': '28 சோர்சா',
  '28 gaint': '28 ஜெயிண்ட்',
  '2k full count': '2K ஃபுல் கவுண்ட்',
  '2k short count': '2K ஷார்ட் கவுண்ட்',
  '4" 24 deluxe': '4" 24 டீலக்ஸ்',
  '4" 50 deluxe': '4" 50 டீலக்ஸ்',
  '50 deluxe': '50 டீலக்ஸ்',
  '500gm': '500 கிராம்',
  '56 chorsa': '56 சோர்சா',
  '56 gaint': '56 ஜெயிண்ட்',
  '5k full count': '5K ஃபுல் கவுண்ட்',
  '5k half count': '5K ஹாஃப் கவுண்ட்',

  // ── Combo Pack ──────────────────────────────────────────
  '2k combo': '2K காம்போ',
  '4k combo': '4K காம்போ',

  // ── New Arrivals ────────────────────────────────────────
  'bharath tank': 'பாரத் டேங்க்',
  'black berry': 'பிளாக் பெர்ரி',
  'bubbles': 'பபல்ஸ்',
  'guitar': 'கிட்டார்',
  'hand siren': 'ஹேண்ட் சைரன்',
  'kadayu': 'கடாயு',

  // ── Sony Comets ─────────────────────────────────────────
  '6" pipe': '6" பைப்',
  'blue octopus(2pcs)': 'ப்ளூ ஆக்டோபஸ் (2 எண்ணம்)',
  'blue octopus (2pcs)': 'ப்ளூ ஆக்டோபஸ் (2 எண்ணம்)',
  'blue pearls (2pcs)': 'ப்ளூ பேர்ல்ஸ் (2 எண்ணம்)',
  'duos ring series (2pcs)': 'டியூஸ் ரிங் சீரிஸ் (2 எண்ணம்)',
  'kaleidoscope (2pcs)': 'கலைடோஸ்கோப் (2 எண்ணம்)',
  'master of magic (7 step - 2pcs)': 'மாஸ்டர் ஆஃப் மேஜிக் (7 ஸ்டெப் - 2 எண்ணம்)',
  'master of magic': 'மாஸ்டர் ஆஃப் மேஜிக்',
  'orange(2pcs)': 'ஆரஞ்ச் (2 எண்ணம்)',
  'orange (2pcs)': 'ஆரஞ்ச் (2 எண்ணம்)',
  'panorama (2pcs)': 'பனோரமா (2 எண்ணம்)',
  'texas rider (1 pcs)': 'டெக்சாஸ் ரைடர் (1 எண்ணம்)',
  'vibgyor(2pcs)': 'விப்கியார் (2 எண்ணம்)',
  'vibgyor (2pcs)': 'விப்கியார் (2 எண்ணம்)',
};

const KEYWORD_MAP = [
  [/sparklers/gi, 'மத்தாப்பு'],
  [/sparkler/gi, 'மத்தாப்பு'],
  [/flower pots/gi, 'பூச்சட்டி'],
  [/flower pot/gi, 'பூச்சட்டி'],
  [/pots/gi, 'பூச்சட்டி'],
  [/pot/gi, 'பூச்சட்டி'],
  [/ground chakkar/gi, 'தரை சக்கரம்'],
  [/wire chakkar/gi, 'கம்பி சக்கரம்'],
  [/whizling wheel/gi, 'விசில் சக்கரம்'],
  [/drizzling wheel/gi, 'டிரிஸ்லிங் வீல்'],
  [/lotus wheel/gi, 'தாமரை சக்கரம்'],
  [/wheel/gi, 'வீல்'],
  [/chakkar/gi, 'சக்கரம்'],
  [/chakar/gi, 'சக்கரம்'],
  [/spinner/gi, 'ஸ்பின்னர்'],
  [/twinkling star/gi, 'சரவெடி'],
  [/twinkling/gi, 'சரவெடி'],
  [/one sound/gi, 'ஒற்றை வெடி'],
  [/sound/gi, 'சவுண்ட்'],
  [/crackers/gi, 'வெடி'],
  [/cracker/gi, 'வெடி'],
  [/rocket/gi, 'ராக்கெட்'],
  [/bomb/gi, 'பாம்'],
  [/shots/gi, 'ஷாட்ஸ்'],
  [/shot/gi, 'ஷாட்ஸ்'],
  [/comets/gi, 'காமட்ஸ்'],
  [/comet/gi, 'காமட்'],
  [/electric/gi, 'எலக்ட்ரிக்'],
  [/tri colour/gi, 'மூவர்ண'],
  [/tricolor/gi, 'மூவர்ண'],
  [/green/gi, 'பச்சை'],
  [/red/gi, 'சிவப்பு'],
  [/yellow/gi, 'மஞ்சள்'],
  [/blue/gi, 'நீலம்'],
  [/gold/gi, 'தங்கம்'],
  [/golden/gi, 'கோல்டன்'],
  [/silver/gi, 'வெள்ளி'],
  [/colour/gi, 'கலர்'],
  [/color/gi, 'கலர்'],
  [/deluxe/gi, 'டீலக்ஸ்'],
  [/delux/gi, 'டீலக்ஸ்'],
  [/super/gi, 'சூப்பர்'],
  [/mega/gi, 'மெகா'],
  [/giant/gi, 'ஜயண்ட்'],
  [/big/gi, 'பெரியது'],
  [/small/gi, 'சிறியது'],
  [/special/gi, 'ஸ்பெஷல்'],
  [/pencil/gi, 'பென்சில்'],
  [/pencils/gi, 'பென்சில்'],
  [/lakshmi/gi, 'லட்சுமி'],
  [/laxmi/gi, 'லட்சுமி'],
  [/laksmi/gi, 'லட்சுமி'],
  [/crocodile/gi, 'முதலை'],
  [/kuruvi/gi, 'குருவி'],
  [/bijili/gi, 'பிஜிலி'],
  [/bijli/gi, 'பிஜிலி'],
  [/match/gi, 'தீப்பெட்டி'],
  [/matches/gi, 'தீப்பெட்டி'],
  [/box/gi, 'பாக்ஸ்'],
  [/pack/gi, 'பேக்'],
  [/combo/gi, 'காம்போ'],
  [/gift/gi, 'கிஃப்ட்'],
  [/guns/gi, 'துப்பாக்கி'],
  [/gun/gi, 'துப்பாக்கி'],
  [/caps/gi, 'கேப்'],
  [/cap/gi, 'கேப்'],
  [/novelties/gi, 'நாவல்டீஸ்'],
  [/fountain/gi, 'ஃபவுண்டன்'],
  [/sky/gi, 'ஸ்கை'],
  [/fancy/gi, 'ஃபேன்சி'],
  [/chaska/gi, 'சஸ்கா'],
  [/masks/gi, 'மாஸ்கா'],
  [/mini/gi, 'மினி'],
  [/master/gi, 'மாஸ்டர்'],
  [/nos/gi, 'எண்ணம்'],
  [/pcs/gi, 'எண்ணம்'],
  [/pc/gi, 'எண்ணம்']
];

const WORD_MAP = {
  'one': 'ஒன்', 'two': 'டூ', 'three': 'த்ரீ', 'four': 'ஃபோர்', 'five': 'ஃபைவ்',
  'six': 'சிக்ஸ்', 'seven': 'செவன்', 'eight': 'எயிட்', 'nine': 'நைன்', 'ten': 'டென்',
  'sound': 'சவுண்ட்', 'cracker': 'வெடி', 'crackers': 'வெடி', 'kuruvi': 'குருவி',
  'lakshmi': 'லட்சுமி', 'laxmi': 'லட்சுமி', 'laksmi': 'லட்சுமி', 'crocodile': 'முதலை', 'deluxe': 'டீலக்ஸ்', 'delux': 'டீலக்ஸ்', 'mega': 'மெகா',
  'super': 'சூப்பர்', 'giant': 'ஜயண்ட்', 'big': 'பெரியது', 'small': 'சிறியது',
  'special': 'ஸ்பெஷல்', 'bijili': 'பிஜிலி', 'bijli': 'பிஜிலி', 'ground': 'தரை', 'chakkar': 'சக்கரம்',
  'chakar': 'சக்கரம்', 'wheel': 'வீல்', 'spinner': 'ஸ்பின்னர்', 'spin': 'ஸ்பின்',
  'master': 'மாஸ்டர்', 'mini': 'மினி', 'wire': 'கம்பி', 'whizling': 'விசில்',
  'whistling': 'விசிலிங்', 'whistle': 'விசில்', 'flower': 'பூ', 'pots': 'பூச்சட்டி',
  'pot': 'பூச்சட்டி', 'tri': 'மூ', 'colour': 'கலர்', 'color': 'கலர்',
  'kotti': 'கோட்டி', 'twinkling': 'சரவெடி', 'star': 'ஸ்டார்', 'stars': 'ஸ்டார்ஸ்',
  'chora': 'சோரா', 'wala': 'சரம்', 'vala': 'சரம்', 'rocket': 'ராக்கெட்',
  'rockets': 'ராக்கெட்', 'lunik': 'லூனிக்', 'bomb': 'பாம்', 'bombs': 'பாம்',
  'hydro': 'ஹைட்ரோ', 'atom': 'ஆட்டம்', 'hydrogen': 'ஹைட்ரஜன்', 'digital': 'டிஜிட்டல்',
  'king': 'கிங்', 'shots': 'ஷாட்ஸ்', 'shot': 'ஷாட்ஸ்', 'comets': 'காமட்ஸ்',
  'comet': 'காமட்', 'sky': 'ஸ்கை', 'fancy': 'ஃபேன்சி', 'novelties': 'நாவல்டீஸ்',
  'novelty': 'நாவல்டி', 'fountain': 'ஃபவுண்டன்', 'fountains': 'ஃபவுண்டன்',
  'pencil': 'பென்சில்', 'pencils': 'பென்சில்', 'sparklers': 'மத்தாப்பு',
  'sparkler': 'மத்தாப்பு', 'electric': 'எலக்ட்ரிக்', 'red': 'சிவப்பு',
  'green': 'பச்சை', 'blue': 'நீலம்', 'yellow': 'மஞ்சள்', 'gold': 'தங்கம்',
  'golden': 'கோல்டன்', 'silver': 'வெள்ளி', 'magic': 'மேஜிக்', 'bambara': 'பம்பரம்',
  'peacock': 'மயில்', 'siren': 'சைரன்', 'water': 'வாட்டர்', 'queen': 'குயின்',
  'pop': 'பாப்', 'roll': 'ரோல்', 'cap': 'கேப்', 'caps': 'கேப்', 'snake': 'பாம்பு',
  'eggs': 'மாத்திரை', 'egg': 'மாத்திரை', 'match': 'தீப்பெட்டி', 'matches': 'தீப்பெட்டி',
  'box': 'பாக்ஸ்', 'gift': 'கிஃப்ட்', 'combo': 'காம்போ', 'pack': 'பேக்',
  'guns': 'துப்பாக்கி', 'gun': 'துப்பாக்கி', 'sony': 'சோனி', 'new': 'புதிய',
  'arrivals': 'வரவுகள்', 'arrival': 'வரவு', 'nos': 'எண்ணம்', 'pcs': 'எண்ணம்',
  'pc': 'எண்ணம்', 'smoke': 'புகை', 'flash': 'பிளாஷ்', 'shower': 'ஷவர்',
  'waterfall': 'வாட்டர்ஃபால்', 'drone': 'ட்ரோன்', 'butterfly': 'பட்டாம்பூச்சி',
  'light': 'லைட்', 'night': 'நைட்', 'strobe': 'ஸ்ட்ரோப்', 'glitter': 'கிளிட்டர்',
  'crackling': 'க்ராக்கிளிங்', 'fire': 'பயர்', 'ice': 'ஐஸ்', 'royal': 'ராயல்',
  'classic': 'கிளாசிக்', 'ultra': 'அல்ட்ரா', 'prime': 'பிரைம்', 'multi': 'மல்டி',
  'double': 'டபுள்', 'triple': 'டிரிபிள்', 'single': 'சிங்கிள்', 'chaska': 'சஸ்கா',
  'masks': 'மாஸ்கா', 'drizzling': 'டிரிஸ்லிங்', 'lotus': 'தாமரை', 'asoka': 'அசோகா'
};

function transliterateWord(word) {
  const clean = word.toLowerCase();
  if (WORD_MAP[clean]) return WORD_MAP[clean];
  if (/^\d+(\.\d+)?$/.test(clean)) return word; // keep numbers

  // Basic character transliteration for unknown English words
  let t = clean
    .replace(/ch/g, 'ச')
    .replace(/sh/g, 'ஷ')
    .replace(/th/g, 'த')
    .replace(/ph/g, 'ஃப')
    .replace(/ck/g, 'க்')
    .replace(/ee/g, 'ீ')
    .replace(/oo/g, 'ூ')
    .replace(/ai/g, 'ை')
    .replace(/au/g, 'ௌ')
    .replace(/a/g, 'அ')
    .replace(/b/g, 'ப')
    .replace(/c/g, 'க')
    .replace(/d/g, 'ட')
    .replace(/e/g, 'எ')
    .replace(/f/g, 'ஃப')
    .replace(/g/g, 'க')
    .replace(/h/g, 'ஹ')
    .replace(/i/g, 'இ')
    .replace(/j/g, 'ஜ')
    .replace(/k/g, 'க')
    .replace(/l/g, 'ல')
    .replace(/m/g, 'ம')
    .replace(/n/g, 'ந')
    .replace(/o/g, 'ஒ')
    .replace(/p/g, 'ப')
    .replace(/q/g, 'க')
    .replace(/r/g, 'ர')
    .replace(/s/g, 'ஸ')
    .replace(/t/g, 'ட')
    .replace(/u/g, 'உ')
    .replace(/v/g, 'வ')
    .replace(/w/g, 'வ')
    .replace(/x/g, 'க்ஸ்')
    .replace(/y/g, 'ய')
    .replace(/z/g, 'ஜ');
  return t;
}

export function getTamilName(product) {
  if (!product) return "";

  // 1. Check if explicit Tamil name field exists on product object
  if (typeof product === "object") {
    const explicit = product.tamil || product.tamil_name || product.productname_tamil;
    if (explicit && typeof explicit === "string" && explicit.trim() !== "") {
      return explicit.trim();
    }
  }

  const englishName = (typeof product === "string" ? product : (product.productname || product.product_name || "")).trim();
  if (!englishName) return "";

  const lower = englishName.toLowerCase();
  const normalizedKey = lower.replace(/''/g, '"').replace(/\s+/g, ' ').trim();

  // 2. Exact lookup in dictionary
  if (EXACT_TAMIL_MAP[lower]) {
    return EXACT_TAMIL_MAP[lower];
  }
  if (EXACT_TAMIL_MAP[normalizedKey]) {
    return EXACT_TAMIL_MAP[normalizedKey];
  }

  // 3. Multi-word phrase & keyword replacement
  let translated = englishName;
  for (const [regex, tamilWord] of KEYWORD_MAP) {
    translated = translated.replace(regex, tamilWord);
  }

  // 4. Token fallback for any remaining untranslated English words
  if (/[a-zA-Z]/.test(translated)) {
    translated = translated.split(/(\s+|[(),\-/]+)/).map(token => {
      if (/^[a-zA-Z]+$/.test(token)) {
        return transliterateWord(token);
      }
      return token;
    }).join("");
  }

  return translated;
}

let cachedBase64Font = null;

// Utility to load Noto Sans Tamil font into jsPDF document dynamically
export const ensureTamilFont = async (doc) => {
  try {
    if (!cachedBase64Font) {
      const urls = [
        "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-tamil@latest/400-normal.ttf",
        "https://raw.githubusercontent.com/google/fonts/main/ofl/notosanstamil/static/NotoSansTamil-Regular.ttf",
        "https://fonts.gstatic.com/s/notosanstamil/v27/9oZrCj45_rBZtB8qQ52jD3j3q7d4.ttf"
      ];
      for (const url of urls) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const fontBuffer = await res.arrayBuffer();
            let binary = "";
            const bytes = new Uint8Array(fontBuffer);
            const len = bytes.byteLength;
            const chunkSize = 8192;
            for (let i = 0; i < len; i += chunkSize) {
              binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
            }
            cachedBase64Font = btoa(binary);
            break;
          }
        } catch (e) {
          // try next URL
        }
      }
    }

    if (cachedBase64Font) {
      if (typeof document !== "undefined" && !document.getElementById("noto-sans-tamil-style")) {
        try {
          const style = document.createElement("style");
          style.id = "noto-sans-tamil-style";
          style.appendChild(
            document.createTextNode(`
              @font-face {
                font-family: 'Noto Sans Tamil';
                src: url('data:font/ttf;base64,${cachedBase64Font}') format('truetype');
                font-weight: normal;
                font-style: normal;
              }
            `)
          );
          document.head.appendChild(style);
        } catch (e) {
          // ignore style injection error
        }
      }

      doc.addFileToVFS("NotoSansTamil-Regular.ttf", cachedBase64Font);
      doc.addFont("NotoSansTamil-Regular.ttf", "NotoSansTamil", "normal", "Identity-H");
      doc.addFont("NotoSansTamil-Regular.ttf", "NotoSansTamil", "bold", "Identity-H");
      doc.addFont("NotoSansTamil-Regular.ttf", "NotoSansTamil", "italic", "Identity-H");
      doc.addFont("NotoSansTamil-Regular.ttf", "NotoSansTamil", "bolditalic", "Identity-H");
      doc.setFont("NotoSansTamil", "normal");
      return "NotoSansTamil";
    }
  } catch (err) {
    console.warn("Tamil font loading failed, using default font:", err);
  }
  return null;
};

export const splitTamilText = (text) => {
  if (!text) return [];
  const trimmed = String(text).trim();
  if (!trimmed) return [];
  if (trimmed.includes("\n")) {
    return trimmed.split("\n").map(l => l.trim()).filter(Boolean).slice(0, 2);
  }
  const words = trimmed.split(/\s+/);
  if (words.length <= 1) {
    return [trimmed];
  }
  if (words.length === 2) {
    if (trimmed.length > 18) {
      return [words[0], words[1]];
    }
    return [trimmed];
  }

  // 3 or more words: large number of words -> split into 2 balanced lines
  let bestIdx = 1;
  let bestCost = Infinity;
  for (let i = 1; i < words.length; i++) {
    const l1 = words.slice(0, i).join(" ");
    const l2 = words.slice(i).join(" ");
    let cost = Math.abs(l1.length - l2.length);
    if (l1.length > 22) cost += 50 + (l1.length - 22) * 5;
    if (l2.length > 22) cost += 50 + (l2.length - 22) * 5;
    if (cost < bestCost) {
      bestCost = cost;
      bestIdx = i;
    }
  }

  return [words.slice(0, bestIdx).join(" "), words.slice(bestIdx).join(" ")];
};

const canvasCache = new Map();

// Standard 96 DPI CSS px to mm conversion constant (25.4mm / 96px = ~0.264583)
const MM_PER_CSS_PX = 0.264583;

// Renders Tamil text into high-resolution PNG Data URL for PDF table cells
export const renderTamilTextToDataURL = (text, fontSize = 10, color = "#111827") => {
  if (!text) return null;
  const lines = splitTamilText(text);
  if (!lines || lines.length === 0) return null;

  const cacheKey = `${lines.join("::")}_${fontSize}_${color}`;
  if (canvasCache.has(cacheKey)) {
    return canvasCache.get(cacheKey);
  }

  const canvas = document.createElement("canvas");
  const dpr = 3; // 300 DPI high resolution

  const fontDecl = `${fontSize}px "Noto Sans Tamil", "Nirmala UI", "Latha", "Segoe UI Historic", "Tamil Sangam MN", "Arial Unicode MS", "Catamaran", sans-serif`;

  const tempCtx = canvas.getContext("2d");
  tempCtx.font = fontDecl;

  // Measure all lines
  let maxLineWidth = 0;
  for (const line of lines) {
    const metrics = tempCtx.measureText(line);
    if (metrics.width > maxLineWidth) {
      maxLineWidth = metrics.width;
    }
  }

  const textWidth = Math.max(Math.ceil(maxLineWidth) + 6, 25);
  const lineHeight = Math.ceil(fontSize * 1.35);
  const textHeight = lines.length === 1 ? Math.max(Math.ceil(fontSize * 1.4), 14) : Math.max(lineHeight * 2, 28);

  canvas.width = textWidth * dpr;
  canvas.height = textHeight * dpr;

  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, textWidth, textHeight);

  ctx.font = fontDecl;
  ctx.fillStyle = color;
  ctx.textBaseline = "top";

  if (lines.length === 1) {
    const y = Math.max(0, (textHeight - fontSize * 1.25) / 2);
    ctx.fillText(lines[0], 2, y);
  } else {
    ctx.fillText(lines[0], 2, 1);
    ctx.fillText(lines[1], 2, 1 + lineHeight);
  }

  const result = {
    dataUrl: canvas.toDataURL("image/png"),
    width: textWidth,
    height: textHeight,
    widthMm: textWidth * MM_PER_CSS_PX,
    heightMm: textHeight * MM_PER_CSS_PX,
    lineCount: lines.length,
    lines
  };

  canvasCache.set(cacheKey, result);
  return result;
};
