import { authorsDE } from '../services/data/authors/de';
import { authorsEN } from '../services/data/authors/en';

// Find authors without detailed biographies
const deAuthorsMissingLong = authorsDE.filter(author => {
  const hasLongBio = author.biography?.long && author.biography.long.length > 500;
  return !hasLongBio;
});

const enAuthorsMissingLong = authorsEN.filter(author => {
  const hasLongBio = author.biography?.long && author.biography.long.length > 500;
  return !hasLongBio;
});

console.log('=== DEUTSCHE AUTOREN OHNE AUSFÜHRLICHE BIOGRAPHIE ===');
console.log(`Gesamt: ${deAuthorsMissingLong.length}\n`);

deAuthorsMissingLong.forEach((author, index) => {
  console.log(`${index + 1}. ${author.name} (${author.id})`);
  if (author.biography?.short) {
    console.log(`   Kurz-Bio: ${author.biography.short.substring(0, 80)}...`);
  }
  console.log('');
});

console.log('\n=== ENGLISCHE AUTOREN OHNE AUSFÜHRLICHE BIOGRAPHIE ===');
console.log(`Gesamt: ${enAuthorsMissingLong.length}\n`);

enAuthorsMissingLong.forEach((author, index) => {
  console.log(`${index + 1}. ${author.name} (${author.id})`);
  if (author.biography?.short) {
    console.log(`   Short bio: ${author.biography.short.substring(0, 80)}...`);
  }
  console.log('');
});

// Export for use in other scripts
export { deAuthorsMissingLong, enAuthorsMissingLong };
