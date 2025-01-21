
const deleteProduct = (btn) => {
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;
    const prodId = btn.parentNode.querySelector("[name=productId]").value;
    const product = btn.closest('article');

    // console.log(csrf, prodId);
    fetch(`/admin/products/${prodId}`, {
        method: 'DELETE',
        headers: {
            'csrf-token': csrf
        }
    }).then(res => {
        return res.json()
    })
    .then(data => {
        // console.log(data);
        product.remove();
    })
    .catch(err => console.log(err))

    
};
