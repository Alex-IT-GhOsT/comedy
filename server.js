import express from 'express';
import mongoose from 'mongoose';
import expressHandlebars from 'express-handlebars';
import { fileURLToPath } from 'url'; // Импортируем функцию для работы с URL
import path from 'path';
import bodyParser from 'body-parser';
import SchemaFilm from './BD/film.js';
import Films from './Films/films.js';
import Comment from './BD/comment.js';
import session from 'express-session';
import Rates from './BD/rate.js';
import Admins from './BD/admin.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const handlebars = expressHandlebars.create({
	defaultLayout: 'main', 
	extname: 'hbs',
  runtimeOptions: {
    allowProtoPropertiesByDefault: true
  },
  helpers: { 
    getTime: function(time) {
   
      const currentTime = time;
      const date = new Date(currentTime);
     
      const months = ['января', 'февраля', 'марта', 'апреля', 'май', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']

      const year = date.getFullYear();
      const month = date.getMonth();
      const currentMonth = months[month]
      const day = date.getDate();
      const hour = date.getHours();
      const min = date.getMinutes();
    
      return `${day} ${currentMonth} ${year} ${hour < 10 ? '0' + hour : hour} : ${min < 10 ? '0' + min : min }`
    },
    getAverageRating: function(rate, vote) {
      return (rate / vote).toFixed(2) 
    }
  }
});

app.engine('hbs', handlebars.engine);
app.set('view engine', 'hbs');

mongoose.connect('mongodb://127.0.0.1:27017/siteComedy', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Ошибка подключения к MongoDB: '));
db.once('open', () => {
  console.log('Подключено к MongoDB');
});
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public'))); 
app.use(session({
  secret: 'qwert',
  resave: false,
  saveUninitialized: true
}))
app.use(express.json());

app.get('/', async(req,res) => {
  let films = await SchemaFilm.find({});
    console.log(films)
    res.render('home', {films});
})

app.get('/pageWatch/:id', async (req,res) => {
  const idFilm = req.params.id;
  let film = await SchemaFilm.find({_id: idFilm });
  const isComment = req.query.isComment === 'true';
  const comment = await Comment.find({film_id: idFilm}).sort({created_at: -1});
  const oldComment = true;
  
  res.render('pageWatch', {
    film: film,
    actors: film.actors,
    idFilm: idFilm,
    isComment: isComment,
    comment: comment,
    oldComment: oldComment,
  } )
})

app.post('/addComment', async(req,res) => {
  const commentText = req.body.textaria;
  const authorName = req.body.name;
  const film_id = req.body.film_id;
  const commentNew = new Comment({
    film_id: film_id,
    user_id: authorName,
    text: commentText,
    created_at: Date.now(),
  })
  req.session.comment = {
    textaria: commentText,
    name: authorName,
    film_id: film_id,
    created_at: Date.now()
  }
  commentNew.save().then(save => {
    console.log('save', save)
    res.redirect(`pageWatch/${film_id}?isComment=true`);
  }).catch(err => {
    console.error('err',err)
  })
})

app.post('/addRate/:id', async(req,res) => {
  const {rating} = req.body;
  const film_id = req.params.id;
  const rateNew = new Rates({
    film_id: film_id,
    rate: rating,
  })
  rateNew.save().then(save => {
    console.log('save',save);
  }).catch(err => {
    console.error('err',err);
  })
  const rate = await SchemaFilm.find({_id: film_id}, {totalRating:1});
  const vote = await SchemaFilm.find({_id: film_id}, {totalVotes:1});
  const ress = rate.map((item) => item.totalRating).join(); 
  const ress1 = vote.map((item) => item.totalVotes).join(); 
  const avg = (+ress / +ress1).toFixed(2);
  await SchemaFilm.updateOne({_id:film_id}, {$inc:{totalVotes:1, totalRating: rating}});
  await SchemaFilm.updateOne({_id:film_id}, {$set:{averageRating: avg}});
})

app.post('/sortFilm/', async (req,res) => {
  const year = req.body.year !== "Год" ? parseInt(req.body.year) : null;
  const country = req.body.country !== "Страна" ? req.body.country : null;
  const rate = req.body.rate !== "Рейтинг" ? parseInt(req.body.rate) : null;
  const filter = {};
  if (year) {
    filter.year = year;
  }
  if (country) {
    filter.country = country;
  }
  try{
    const result = await SchemaFilm.find(filter).sort({averageRating: rate});
    res.render('home',{
      films: result
    })
  } catch (err) {
    console.error(err);
    res.status(500).send('Произошла ошибка при поиске фильмов.');
  }
})

app.get('/enter/',(req,res) => {
  res.render('enter');
})

app.post('/enter/',async (req,res) => {
  console.log('ты тут')
  const nameAdmin = req.body.name;
  const passAdmin = req.body.pass;

  // проверка админа
  // const admin = new Admins({
  //   login: req.body.name,
  //   password: req.body.pass
  // })

  // admin.save().then(save => {
  //   console.log(save, 'успешно')
  // }).catch(err => {
  //   console.error(err,'ошибка')
  // })

 const admin = await Admins.find({});
 let isAdmin = false;
 admin.forEach((item) => {
  if (item.login == nameAdmin && item.password == passAdmin ) {
    isAdmin = true;
    }
 })
 if (isAdmin) {
  res.redirect('/Films/');
} else {
  res.send('неправильное имя или пароль');
  }
})
app.get('/Films/',async(req,res) => {

  const edit = req.query.edit;
  const del = req.query.del;
  const add = req.query.add;
  if (edit) {
    res.redirect('/editFilm');
  } else if (del) {
    res.redirect('/delFilm');
  } else if (add) {
    res.redirect('/addFilm');
  } else {
    res.render('updateFilms');
  }
})

app.get('/editFilm/', async(req,res) => {
  const films = await SchemaFilm.find({});
  res.render('editFilm',{films}); // показ списка фильмов
})

app.post('/editFilmProcess/', async(req,res) => {
  const idFilm = req.body.film;
  const film = await SchemaFilm.findOne({_id: idFilm});
  res.render('editFilmProcess',{idFilm,film});
})

app.post('/editFilmSuccess',async(req,res) => {
  const idFilm = req.body.id;
  const filter = {_id: idFilm};
  const update = {
    $set: {
        title: req.body.title,
        rate: +req.body.rate,
        year: +req.body.year,
        country: req.body.country,
        genre: req.body.genre,
        duration: +req.body.duration,
        premiere: req.body.premiere,
        quality: req.body.quality,
        full_description: req.body.full_description,
        short_description: req.body.short_description,
        img: req.body.img,
        url: req.body.url,
        actors: req.body.actors,
        director: req.body.director,
        totalVotes: +req.body.totalVotes ,
        totalRating: +req.body.totalRating,
        averageRating:+req.body.averageRating ,
    }
  };
   await SchemaFilm.findOneAndUpdate(filter,update,{new: true}).then(ch => {
    console.log(ch, 'успешно')
   }).catch(err => {
    console.error(err, "не успешно")
   })
  res.render('editFilmSucces');
})

app.get('/delFilm/', async(req,res) => {
  const films = await SchemaFilm.find({});
  res.render('delFilm',{films});
})

app.post('/delFilmSucces',async(req,res) => {
  const idFilm = req.body.film;
  await SchemaFilm.deleteOne({_id: idFilm}).then(del => {
    console.log(del, 'success')
  }).catch(err => {
    console.error(err, 'not success')
  })
  res.render('delFilmSucces');
})

app.get('/addFilm/', async(req,res) => {
  res.render('addFilm');
})

app.post('/addFilmSuccess', async(req,res) => {
  const addFilm = {
        title: req.body.title,
        rate: +req.body.rate,
        year: +req.body.year,
        country: req.body.country,
        genre: req.body.genre,
        duration: +req.body.duration,
        premiere: req.body.premiere,
        quality: req.body.quality,
        full_description: req.body.full_description,
        short_description: req.body.short_description,
        img: req.body.img,
        url: req.body.url,
        actors: req.body.actors,
        director: req.body.director,
        totalVotes: +req.body.totalVotes ,
        totalRating: +req.body.totalRating,
        averageRating:+req.body.averageRating ,
  };
  await SchemaFilm.collection.insertOne(addFilm).then(add => {
    console.log(add, 'успешно')
  }).catch(err => {
    console.error(err,'не добавлен')
  })
  res.render('addFilmSuccess');
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});