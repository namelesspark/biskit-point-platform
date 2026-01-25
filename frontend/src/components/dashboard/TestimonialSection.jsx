// src/components/TestimonialSection.jsx
import React from 'react';

function TestimonialSection() {
  // 임시 데이터
  const testimonials = [
    {
      id: 1,
      name: 'Andi Antennae',
      role: 'Director of Air Logistics',
      avatar: '😊',
      content: 'Your expectations will fly sky high with Namediy. I felt like I was soaring. The user experience was simply fantastic—I would pin my hopes on it again and again.',
      color: 'pink',
    },
    {
      id: 2,
      name: 'Sally Spiracle',
      role: 'Nest Founder',
      avatar: '😄',
      content: 'When we began building this colony, I was skeptical about how we could make sure the right bugs would find us to join. Namediy\'s integrated solution exceeded all my expectations.',
      color: 'purple',
    },
    {
      id: 3,
      name: 'Dev Doodlebug',
      role: 'Life Cycle Manager',
      avatar: '😎',
      content: 'Namediy\'s tools for managing our identity through many stages of development—larval, pupal, and far beyond—were top notch. I\'ve been through metamorphosis many times, and I was impressed.',
      color: 'green',
    },
    {
      id: 4,
      name: 'Wanda Wingleton',
      role: 'Nectar Marketing',
      avatar: '😃',
      content: 'In the garden of life, some things are just very sweet. This is one of them. Namediy made it so easy to find the flowers we needed in our busy summer season.',
      color: 'yellow',
    },
    {
      id: 5,
      name: 'Carl Caterpillar',
      role: 'Head of Growth',
      avatar: '🐛',
      content: 'I\'ve been transformed completely. I wouldn\'t use any other service.',
      color: 'green-light',
    },
    {
      id: 6,
      name: 'Clara Chrysalis',
      role: 'Emergent Products',
      avatar: '🦋',
      content: 'It\'s a delicate time when butterflies emerge. They\'re searching for their place among the leaves. And that\'s where Namediy popped in to help.',
      color: 'blue',
    },
    {
      id: 7,
      name: 'Sophia Segment',
      role: 'CIO',
      avatar: '🐞',
      content: 'As Chief Insect Officer, it\'s my job to make sure all bugs feel represented, and Namediy exceeded all my expectations.',
      color: 'red',
    },
  ];

  return (
    <section className="testimonial-section">
      <div className="section-header">
        <h2 className="section-title">게시판</h2>
        <button className="view-all-button">전체 보기</button>
      </div>

      <div className="testimonial-grid">
        {testimonials.map((item) => (
          <div key={item.id} className={`testimonial-card ${item.color}`}>
            <div className="testimonial-header">
              <span className="avatar">{item.avatar}</span>
              <div className="author-info">
                <h4>{item.name}</h4>
                <p>{item.role}</p>
              </div>
            </div>
            <p className="testimonial-content">{item.content}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default TestimonialSection;