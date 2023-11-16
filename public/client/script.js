document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.full-discription')) {
    const ratingForm = document.getElementById('ratingForm')
    const stars = ratingForm.querySelectorAll('.current-ration__rate')
    stars.forEach(star => {
        star.addEventListener('click', function(event) {
            event.preventDefault(); // не дает перезегрузку страницы
            const rating = star.getAttribute('data-rating');
            const filmId = ratingForm.getAttribute('action').split('/').pop() // извлечени id
            //const prevRating = localStorage.getItem(filmId); // получаем id в localStorage
            // if (prevRating !== null) {
            //     alert('уже ставил оценку');
            // } else{
            //     localStorage.setItem(filmId,rating); // сохраняем если еще не ставил оцеку
            //     updateRatingOnServer(filmId,rating).then(response => {
            //         if (response.ok) {
            //             updateRatingOnPage(response.rating);
            //         }
            //     }).catch(err => {
            //         console.log(err)
            //     });
            // }
                updateRatingOnServer(filmId,rating).then(response => {
                    if (response.ok) {
                        updateRatingOnPage(response.rating);
                    }
                }).catch(err => {
                    console.log(err)
                });
        });
    });
    async function updateRatingOnServer(filmId,newRating) {
        try{
            const response = await fetch(`/addRate/${filmId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({rating: newRating})
            });
            return await response.json();
        } catch (err) {
            throw err
        }
    }
    function updateRatingOnPage(newRating) {
        const ratingText = document.querySelector('.ratingText');
        ratingText.textContent = newRating + ' / 5';
        }   
    }
})
