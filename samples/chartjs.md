[comment]: # (title: Support Chartjs in SVG format)
[comment]: # (version: v1.0)
[comment]: # (author: Kuan Cheang)
[comment]: # (client: HappyFarm)
[comment]: # (company: Example Company Ltd.)

# Support Chartjs in SVG format

It will be great if we can draw a chart using markdown, save the time to draw a chart in the document. Dataset can be easily changed in the markdown document.

## Example 1

```js
var data = {
  labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
  datasets: [
    {
      label: '# of Votes',
      data: [12, 19, 3, 5, 2, 3],
      backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 206, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 159, 64, 0.2)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
      ],
      borderWidth: 1,
    },
  ],
};

new Chart(ctx, {
  type: 'bar',
  data: data,
  options: {
    scales: {
      yAxes: [
        {
          ticks: {
            beginAtZero: true,
          },
        },
      ],
    }
  },
})
```

```js chartjs
var data = {
  labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
  datasets: [
    {
      label: '# of Votes',
      data: [12, 19, 3, 5, 2, 3],
      backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 206, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 159, 64, 0.2)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
      ],
      borderWidth: 1,
    },
  ],
};

new Chart(ctx, {
  type: 'bar',
  data: data,
  options: {
    scales: {
      yAxes: [
        {
          ticks: {
            beginAtZero: true,
          },
        },
      ],
    }
  },
})
```


```js
new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Running', 'Swimming', 'Eating', 'Cycling'],
      datasets: [{
          data: [20, 10, 4, 2]
      }]
    }
});
```

```js chartjs
new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Running', 'Swimming', 'Eating', 'Cycling'],
        datasets: [{
            data: [20, 10, 4, 2],
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)'
        }]
    }
});
```

```js
new Chart(ctx, {
    type: 'radar',
    data: {
        labels: ['Running', 'Swimming', 'Eating', 'Cycling'],
        datasets: [{
          data: [20, 10, 4, 2],
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)
        }]
    }
});
```

```js chartjs
new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Running', 'Swimming', 'Eating', 'Cycling'],
      datasets: [{
        data: [20, 10, 4, 2],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      }]
    }
});
```
