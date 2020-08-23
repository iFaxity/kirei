import { defineElement, html, shallowRef, computed, css } from '@kirei/element';

export default defineElement({
  name: 'AppClock',
  props: {
    
  },
  styles: css`
    #clock {
      max-width: 300px;
    }

    #face {
      stroke-width: 2px; stroke: #fff;
    }
    #hour, #min, #sec {
      stroke-width: 1px; fill: #333; stroke: #555;
    }
    #sec { stroke: #f55; }
  `,
  setup() {
    let date = shallowRef(new Date());
    setInterval(() => {
      date.value = new Date();
    }, 1000);

    function transformTime(deg) {
      return `rotate(${deg} 50 50)`;
    }

    const hours = computed(() => {
      const minutes = date.value.getMinutes();
      const hours = date.value.getHours();
      const deg = 30 * (hours % 12) + minutes / 2;
      return transformTime(deg);
    });
    const minutes = computed(() => {
      const deg = 6 * date.value.getMinutes();
      return transformTime(deg);
    });
    const seconds = computed(() => {
      const deg = 6 * date.value.getSeconds();
      return transformTime(deg);
    });

    return () => html`
    <svg id="clock" viewBox="0 0 100 100">
      <circle id="face" cx="50" cy="50" r="45"/>
      <g id="hands">
        <rect id="hour" transform=${hours} x="48.5" y="12.5" width="5" height="40" rx="2.5" ry="2.55" />
        <rect id="min" transform=${minutes} x="48" y="12.5" width="3" height="40" rx="2" ry="2"/>
        <line id="sec" transform=${seconds} x1="50" y1="50" x2="50" y2="16" />
      </g>
    </svg>
    `;
  },
});
