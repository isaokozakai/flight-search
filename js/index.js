$(() => {
  $("#departure-date").datepicker();
  $("#return-date").datepicker();

  $("#from, #to").autocomplete({
    source: function (req, res) {
      $.ajax({
        "async": true,
        "crossDomain": true,
        "data": `text=${req.term}`,
        "url": 'https://cometari-airportsfinder-v1.p.rapidapi.com/api/airports/by-text',
        "method": "GET",
        "headers": {
          "x-rapidapi-host": "cometari-airportsfinder-v1.p.rapidapi.com",
          "x-rapidapi-key": "9e17e55ef7msh7b448d0f0cae1b2p13d1cfjsn95340acc8e72"
        }
      }).done((data) => res(
        data.map(
          (airport) => ({
            label: `${airport.name} (${airport.code})`,
            value: `${airport.name} (${airport.code})`,
            code: airport.code
          })
        )
      ));
    },
    select: function (e, ui) {
      console.log(ui);
    }
  });

});
