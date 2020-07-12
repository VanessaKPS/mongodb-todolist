const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const date = require(__dirname + '/date.js');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();
mongoose.connect(
  'mongodb+srv://admin-vk:test123@cluster0-lzbfn.mongodb.net/todoListDB',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({ name: 'Welcome to your new Todo List' });
const item2 = new Item({ name: 'click the + button to add' });
const item3 = new Item({ name: '<-- click here to delete' });

const defaultItems = [item1, item2, item3];

const listsSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model('list', listsSchema);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));

const today = date.getDate();

app.get('/', (req, res) => {
  Item.find({}, (err, d) => {
    if (d.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (!err) {
          res.redirect('/');
        }
      });
    } else {
      res.render('list', { typeOfList: today, newTasks: d });
    }
  });
});

app.get('/:listType', (req, res) => {
  const listTypeName = _.capitalize(req.params.listType);

  List.findOne({ name: listTypeName }, (err, d) => {
    if (!d) {
      const list = new List({
        name: listTypeName,
        items: defaultItems,
      });
      list.save();
      res.redirect('/' + listTypeName);
    } else {
      res.render('list', { typeOfList: d.name, newTasks: d.items });
    }
  });
});

app.post('/', (req, res) => {
  const task = req.body.firstTask;
  const listName = req.body.button;
  const item = new Item({ name: task });

  if (listName === today) {
    Item.insertMany({ name: task }, (err) => {
      if (!err) {
        res.redirect('/');
      }
    });
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
    });
    res.redirect('/' + listName);
  }
});

app.post('/delete', (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === today) {
    Item.findByIdAndRemove({ _id: checkedItemId }, (err) => {
      res.redirect('/');
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      (err, foundItem) => {
        if (!err) {
          res.redirect('/' + listName);
        }
      }
    );
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('server is running on 3000');
});
