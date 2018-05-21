
const result = document.querySelector('.result')
document.querySelector('.submitbutton')
  .onclick = getClientData

function getClientData() {
  result.innerHTML = 'Getting Data. Please Wait...'
  const clientId = document.querySelector('#clientid').value
  fetch('http://localhost:8008',
    {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
    }
  )
    .then(res => res.json())
    .then(res => {
      let data = ''
      for (d in res) {
        data += `<li><strong>${d}:</strong> ${res[d]}</li>`
      }
      result.innerHTML = `<ul>${data}</ul>`
    })
    .catch(console.err)

}