//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");

const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");


const itemsSchema = new mongoose.Schema({
  name:String
});

const Item = mongoose.model("Item", itemsSchema);

const item1= new Item({
  name:"Buy Food"
})

const item2= new Item({
  name:"Cook Food"
})

const item3= new Item({
  name:"Eat Food"
})

const defaultItems=[item1, item2, item3];

const listSchema = {
  name:String,
  items: [itemsSchema]
};

const List=mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find({}).then((data) => {
    if(data.length===0){
      Item.insertMany(defaultItems).then(function () {
        console.log("Successfully saved default items to DB");
      })
      .catch(function (err) {
        console.log(err);
      });
      res.redirect("/");
    }
    else{
      res.render("list", {listTitle: "Today", newListItems: data});
    }
  });
});

app.get("/:topic", function(req,res){
  const listTitle = _.capitalize(req.params.topic);

  List.findOne({name:listTitle}).then((foundList)=>{
    
    if(!foundList){
      const list=new List({
        name:listTitle,
        items:defaultItems
      });
      list.save();
      res.redirect("/"+listTitle);
    }
    else{
      res.render("list",{listTitle:foundList.name, newListItems:foundList.items});
    }
  })
})


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  

  const item=new Item({
    name:itemName
  });

  if(listName=="Today"){
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name:listName}).then((foundList)=>{
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
  
});

app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName=="Today"){
    Item.deleteOne({_id:checkedItemId}).then(res.redirect("/"));
  }
  else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then(res.redirect("/" + listName));
  }
  
})

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("App listening on port 3000");
});
