import { defineComponent, html, shallowRef, computed, css, onMount, onUnmount } from '@kirei/element';

export default defineComponent({
  name: 'AppClock',
  props: {
    
  },
  styles: css`
    .clock {
      max-width: 300px;
    }
    .face {
      stroke-width: 2px; stroke: #fff;
    }
    .hand {
      stroke-width: 1px;
      fill: #333;
      stroke: #555;
    }
    .hand.sec {
      stroke: #f55;
    }
  `,
  setup() {
    const date = shallowRef(new Date());
    let interval = null;

    onMount(() => {
      interval = setInterval(() => {
        date.value = new Date();
      }, 1000);
    });
    onUnmount(() => {
      clearInterval(interval);
      interval = null;
    });

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
    <svg class="clock" viewBox="0 0 100 100">
      <circle class="face" cx="50" cy="50" r="45"/>
      <g class="hands">
        <rect class="hand hour" transform=${hours} x="48.5" y="12.5" width="5" height="40" rx="2.5" ry="2.55" />
        <rect class="hand min" transform=${minutes} x="48" y="12.5" width="3" height="40" rx="2" ry="2"/>
        <line class="hand sec" transform=${seconds} x1="50" y1="50" x2="50" y2="16" />
      </g>
    </svg>
    `;
  },
});
