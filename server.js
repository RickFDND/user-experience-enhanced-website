console.log('Hier komt je server voor Sprint 10.')

console.log('Gebruik uit Sprint 9 alleen de code die je mee wilt nemen.')

console.log('Zet \'m op!')

// Importeer het npm package Express (uit de door npm aangemaakte node_modules map)
// Deze package is geïnstalleerd via `npm install`, en staat als 'dependency' in package.json
import express from 'express'

// Importeer de Liquid package (ook als dependency via npm geïnstalleerd)
import { Liquid } from 'liquidjs';

// Maak een nieuwe Express applicatie aan, waarin we de server configureren
const app = express()

// Maak werken met data uit formulieren iets prettiger
app.use(express.urlencoded({extended: true}))

// Gebruik de map 'public' voor statische bestanden (resources zoals CSS, JavaScript, afbeeldingen en fonts)
// Bestanden in deze map kunnen dus door de browser gebruikt worden
app.use(express.static('public'))

// Stel Liquid in als 'view engine'
const engine = new Liquid();
app.engine('liquid', engine.express());

// Stel de map met Liquid templates in
// Let op: de browser kan deze bestanden niet rechtstreeks laden (zoals voorheen met HTML bestanden)
app.set('views', './views')


//index.liquid
app.get('/', async function (request, response) {

  const stories = await fetch('https://fdnd-agency.directus.app/items/tm_story?fields=*,audio.audio_file,audio.transcript');
  const playlist = await fetch(`https://fdnd-agency.directus.app/items/tm_playlist`);
  const likes = await fetch('https://fdnd-agency.directus.app/items/tm_likes?filter[profile]=126&fields=*.*');
  
  const storiesJSON = await stories.json();
  const playlistJSON = await playlist.json();
  const likesJSON = await likes.json();

 
  // Zie https://expressjs.com/en/5x/api.html#res.render over response.render()
  response.render('index.liquid', { stories: storiesJSON.data, playlists: playlistJSON.data, likes: likesJSON.data })
})



// Zie https://expressjs.com/en/5x/api.html#app.post.method over app.post()
app.post('/:playlist/like', async function (request, response) {
  
  
  // In request.body zitten alle formuliervelden die een `name` attribuut hebben in je HTML
  console.log(request.body)

  // Via een fetch() naar Directus vullen we nieuwe gegevens in
    await fetch(`https://fdnd-agency.directus.app/items/tm_likes`, {
    method: 'POST',
    body: JSON.stringify({
      profile: 126,
      playlist: request.params.playlist
    }),
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  });

  
  // Zie https://expressjs.com/en/5x/api.html#res.redirect over response.redirect()
  response.redirect(303, '/')
})


// POST route om een like te verwijderen van een specifieke playlist door profiel 126
app.post("/:playlist/unlike", async function (req, res) {
  const playlistId = req.params.id;
  const profileId = 126; // hardcoded profiel-ID

  // Zoek of deze gebruiker een like heeft voor deze playlist
  const likeResponse = await fetch(`https://fdnd-agency.directus.app/items/tm_likes?filter={"profile":${profileId},"playlist":${playlistId}}`);
  const likeData = await likeResponse.json();

  // Als er minstens één like gevonden is
  if (likeData.data.length > 0) {
    const likeId = likeData.data[0].id;

    // Verwijder de like uit Directus
    await fetch(`https://fdnd-agency.directus.app/items/tm_likes/${likeId}`, {
      method: "DELETE",
    });
  }

  // Redirect terug naar homepage of een andere logische route
  res.redirect(303, "/");
});




  
//story unieke slug
app.get('/story/:id', async function (request, response) {
  
  //fetch naar de id vd unieke slug
  const storyResponse = await fetch(`https://fdnd-agency.directus.app/items/tm_story?filter={"id":"${request.params.id}"}&fields=*,audio.audio_file,audio.transcript`);
  
  //zet om naar json data
  const storyResponseJSON = await storyResponse.json();

  // Controleer of er data is voor de opgegeven story
  if (!storyResponseJSON.data || storyResponseJSON.data.length === 0) {
    return response.status(404).send('Story not found');
  }

  // Render de 'story.liquid' pagina met de opgehaalde story data
  response.render('story.liquid', { story: storyResponseJSON.data[0] });
});

app.use((req, res, next) => {
  res.redirect('/'); // Gebruiker wordt doorgestuurd naar de /home pagina
});




// Lokaal is dit poort 8000; als deze applicatie ergens gehost wordt, waarschijnlijk poort 80
app.set('port', process.env.PORT || 8000)

// Start Express op, gebruik daarbij het zojuist ingestelde poortnummer op
app.listen(app.get('port'), function () {
  // Toon een bericht in de console
  console.log(`Daarna kun je via http://localhost:${app.get('port')}/ jouw interactieve website bekijken.\n\nThe Web is for Everyone. Maak mooie dingen 🙂`)
})