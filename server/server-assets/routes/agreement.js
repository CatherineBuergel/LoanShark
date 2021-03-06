let router = require('express').Router()
let Users = require('../models/User.js')
let Ags = require('../models/Agreement.js')


//CREATE a new agreement
router.post('/', (req, res, next) => {
  if (req.body.authorId.toString() == req.session.uid.toString()) {
    Ags.create(req.body)
      .then(ag => res.send(ag))
      .catch(err => res.status(400).send(err))
  } else {
    return res.status(401).send("ACCESS DENIED!")
  }
})


//EDIT an in-progress agreement
router.put('/:id', (req, res, next) => {
  if (typeof req.body.lender == 'object' || typeof req.body.borrower == 'object') {
    if (req.body.lender._id.toString() == req.session.uid.toString() || req.body.borrower._id.toString() == req.session.uid.toString()) {
      Ags.findOneAndUpdate({ _id: req.body._id }, req.body, { new: true })
        .then(ag => {
          res.send(ag)
        })
        .catch(err => {
          console.log(err)
          next()
        })
    }
  } else {
    if (req.body.lender.toString() == req.session.uid.toString() || req.body.borrower.toString() == req.session.uid.toString()) {
      Ags.findOneAndUpdate({ _id: req.body._id }, req.body, { new: true })
        .then(ag => {
          res.send(ag)
        })
        .catch(err => {
          console.log(err)
          next()
        })
    }
  }
})


//find all in-progress negotiations with you as lender/borrower
router.get('/negotiations', (req, res, next) => {
  let userAgs = Ags.find({
    $or: [
      { lender: req.session.uid },
      { borrower: req.session.uid }
    ]
  })
  userAgs.find({ agreedUpon: false }).populate('lender', 'name _id image').populate('borrower', 'name _id image')
    .then(ags => {
      res.send(ags)
    })
    .catch(err => {
      console.log(err)
      next()
    })
})


//find all contracts that are currently active/counting down
router.get('/active', (req, res, next) => {
  let userAgs = Ags.find({
    $or: [
      { lender: req.session.uid },
      { borrower: req.session.uid }
    ]
  })
  userAgs.find({
    $and: [
      { agreedUpon: true },
      { closed: false }
    ]
  }).populate('lender', 'name image _id').populate('borrower', 'name image _id')
    .then(ags => {
      res.send(ags)
    })
    .catch(err => {
      console.log(err)
      next()
    })
})

router.get('/closed', (req, res, next) => {
  let userAgs = Ags.find({
    $or: [
      { lender: req.session.uid },
      { borrower: req.session.uid }
    ]
  })
  userAgs.find({ closed: true }).populate('lender', 'name image _id').populate('borrower', 'name image _id')
    .then(ags => {
      res.send(ags)
    })
    .catch(err => {
      console.log(err)
      next()
    })
})


//delete/archive a contract
router.delete('/:id', (req, res, next) => {
  Ags.findById(req.params.id)
    .then(ag => {
      if (ag.agreedUpon == true && ag.authorId.toString() == req.session.uid.toString()) {
        ag.closed = true
        ag.save()
        res.send(ag)
      } else if (ag.lender.toString() == req.session.uid.toString() || ag.borrower.toString() == req.session.uid.toString()) {
        ag.remove(err => {
          if (err) {
            console.log(err)
            next()
            return
          }
          res.send('successfully deleted')
        })
      }
    })

})

// 





module.exports = router