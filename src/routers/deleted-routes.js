// Deleted because added registration & login system

router.get('/users/:id', async (req, res) => {
  // :id is a dynamic value which we can extrac the params from
  const _id = req.params.id;

  try {
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).send();
    }
    res.send(user);
  } catch (e) {
    res.status(500).send();
  }
});
